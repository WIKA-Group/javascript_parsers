import type { ConversionConfig } from '@valibot/to-json-schema'
import type { BaseIssue, BaseSchema } from 'valibot'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { toJsonSchema } from '@valibot/to-json-schema'
import consola from 'consola'
import { writeFile } from 'fs-extra'
import glob from 'tiny-glob'

type ExportedSchemaKeys = 'UplinkOutputSchema' | 'DownlinkInputSchema'
interface OutputFileMap {
  UplinkOutputSchema: 'uplink.schema.json'
  DownlinkInputSchema: 'downlink.schema.json'
}
type SchemasExport = Partial<Record<ExportedSchemaKeys, BaseSchema<unknown, unknown, BaseIssue<unknown>>>>

async function writeSchemaJson(outputDir: string, schemaJson: object, schemaKey: ExportedSchemaKeys) {
  const outputFileMap: OutputFileMap = {
    UplinkOutputSchema: 'uplink.schema.json',
    DownlinkInputSchema: 'downlink.schema.json',
  }

  const schemaPath = path.join(outputDir, outputFileMap[schemaKey])
  try {
    await writeFile(schemaPath, JSON.stringify(schemaJson, null, 2))
    consola.success(`Wrote ${outputFileMap[schemaKey]} to ${outputDir}`)
  }
  catch (err) {
    consola.error(`Failed to write ${outputFileMap[schemaKey]} to ${outputDir}:`, err)
  }
}

async function compileSchemaFiles(schemaFiles: string[]) {
  const config: ConversionConfig = { errorMode: 'warn' }
  const schemaKeys: ExportedSchemaKeys[] = [
    'UplinkOutputSchema',
    'DownlinkInputSchema',
  ]

  await Promise.all(schemaFiles.map(async (file) => {
    // import via file:// URL to make absolute .ts/.js paths reliable in ESM
    let mod: any
    try {
      mod = await import(pathToFileURL(file).href)
    }
    catch (err) {
      consola.error(`Failed to import ${file}:`, err)
      return
    }

    // Support both:
    // - default export object: export default { UplinkOutputSchema, ... }
    // - default export factory: export default () => ({ UplinkOutputSchema, ... })
    // - named exports: export const UplinkOutputSchema = ...
    // - named export factories: export const UplinkOutputSchema = () => schema
    const schemas: SchemasExport = {}

    // Helper to resolve a value that might be a factory (sync/async) or direct schema
    async function resolveValue(val: any, sourceDesc: string) {
      if (typeof val === 'function') {
        try {
          return await val()
        }
        catch (err) {
          consola.error(`Error executing schema factory from ${sourceDesc} in ${file}:`, err)
          return undefined
        }
      }
      return val
    }

    // If default is a factory that returns an object with keys, prefer that
    if (mod?.default) {
      const defResolved = await resolveValue(mod.default, 'default export')
      if (defResolved && typeof defResolved === 'object') {
        // If default export is an object that contains the named keys, copy them.
        let foundKey = false
        for (const key of schemaKeys) {
          if (key in defResolved) {
            schemas[key] = defResolved[key]
            foundKey = true
          }
        }

        // If default resolved to a single schema object (not keyed), try to infer
        // which schema it is from the file path (contains 'uplink'|'downlink').
        if (!foundKey) {
          const p = file.toLowerCase()
          if (p.includes('uplink')) {
            schemas.UplinkOutputSchema = defResolved
            foundKey = true
          }
          else if (p.includes('downlink')) {
            schemas.DownlinkInputSchema = defResolved
            foundKey = true
          }
          else {
            // also check parent directory name
            const parent = path.basename(path.dirname(file)).toLowerCase()
            if (parent.includes('uplink')) {
              schemas.UplinkOutputSchema = defResolved
              foundKey = true
            }
            else if (parent.includes('downlink')) {
              schemas.DownlinkInputSchema = defResolved
              foundKey = true
            }
          }

          if (!foundKey) {
            consola.warn(`Default export in ${file} is a schema object but doesn't contain named keys; cannot infer whether it's uplink or downlink. Export named keys or include 'uplink'/'downlink' in path to auto-assign.`)
          }
        }
      }
    }

    // Named exports: could be direct schema or factory
    for (const key of schemaKeys) {
      if (key in mod) {
        const val = await resolveValue(mod[key], `named export ${key}`)
        if (val !== undefined)
          schemas[key] = val
      }
    }

    if (!Object.keys(schemas).length) {
      consola.warn(`No exported schemas (${schemaKeys.join(', ')}) found in ${file}`)
      return
    }

    function getOutputDirForSource(filePath: string) {
      const base = path.basename(filePath).toLowerCase()
      const parent = path.basename(path.dirname(filePath)).toLowerCase()

      // If file itself is schema(s).ts or index.ts inside schema(s) dir,
      // prefer the schema(s) directory.
      if (base === 'schema.ts' || base === 'schemas.ts' || base === 'schema.js' || base === 'schemas.js') {
        // A single-file schema (schemas.ts) lives in the device directory — write there
        return path.dirname(filePath)
      }

      if (base === 'index.ts' || base === 'index.js') {
        // index.ts inside a schema(s) dir -> write next to the schema directory (its parent)
        if (parent === 'schema' || parent === 'schemas')
          return path.dirname(path.dirname(filePath))
      }

      // If the file happens to sit inside a schema(s) dir but is not named index,
      // prefer the schema parent (device directory) so outputs are next to the
      // schema(s) directory rather than inside it.
      if (parent === 'schema' || parent === 'schemas')
        return path.dirname(path.dirname(filePath))

      // Otherwise, write next to the file
      return path.dirname(filePath)
    }

    const outputDir = getOutputDirForSource(file)

    await Promise.all(schemaKeys.map(async (key) => {
      const schema = schemas[key as ExportedSchemaKeys]
      if (!schema)
        return
      try {
        const schemaJson = toJsonSchema(schema, config)
        await writeSchemaJson(outputDir, schemaJson, key as ExportedSchemaKeys)
      }
      catch (error) {
        consola.error(`Error converting schema for ${key} in ${file}:`, error)
      }
    }))
  }))
}

async function main() {
  // Find all schema files. Devices may use either a single `schema.ts`/`schemas.ts`
  // file or a directory `schema/index.ts` layout. Run multiple globs and
  // de-duplicate results.
  const __dirname = import.meta.dirname

  const patterns = [
    '../src/devices/**/schemas.ts',
    '../src/devices/**/schema.ts',
    '../src/devices/**/schemas/index.ts',
    '../src/devices/**/schema/index.ts',
  ]

  const results = await Promise.all(patterns.map(p => glob(p, { absolute: true, cwd: __dirname })))
  const schemaFiles = Array.from(new Set(results.flat()))

  if (!schemaFiles.length) {
    consola.warn('No schema files found.')
    return
  }
  consola.log(`Found ${schemaFiles.length} schema files.`)
  await compileSchemaFiles(schemaFiles)
}

main()
