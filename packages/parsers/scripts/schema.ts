import type { ConversionConfig } from '@valibot/to-json-schema'
import type { BaseIssue, BaseSchema } from 'valibot'
import { toJsonSchema } from '@valibot/to-json-schema'
import { writeFile } from 'fs-extra'
import glob from 'tiny-glob'

type ExportedSchemaKeys = 'UplinkOutputSchema' | 'DownlinkInputSchema'
interface OutputFileMap {
  UplinkOutputSchema: 'uplink.schema.json'
  DownlinkInputSchema: 'downlink.schema.json'
}
type SchemasExport = Partial<Record<ExportedSchemaKeys, BaseSchema<unknown, unknown, BaseIssue<unknown>>>>

async function writeSchemaJson(sourceFile: string, schemaJson: object, schemaKey: ExportedSchemaKeys) {
  const outputFileMap: OutputFileMap = {
    UplinkOutputSchema: 'uplink.schema.json',
    DownlinkInputSchema: 'downlink.schema.json',
  }
  const schemaPath = sourceFile.replace('schemas.ts', outputFileMap[schemaKey])
  try {
    await writeFile(schemaPath, JSON.stringify(schemaJson, null, 2))
    console.log(`✔️  Wrote ${outputFileMap[schemaKey]} for ${sourceFile}`)
  }
  catch (err) {
    console.error(`❌ Failed to write ${outputFileMap[schemaKey]} for ${sourceFile}:`, err)
  }
}

async function compileSchemaFiles(schemaFiles: string[]) {
  const config: ConversionConfig = { errorMode: 'warn' }
  const schemaKeys: ExportedSchemaKeys[] = [
    'UplinkOutputSchema',
    'DownlinkInputSchema',
  ]

  await Promise.all(schemaFiles.map(async (file) => {
    let schemas: SchemasExport | undefined
    try {
      const mod = await import(file)
      schemas = mod.default as SchemasExport
      if (!schemas || typeof schemas !== 'object') {
        console.warn(`No valid default export in ${file}`)
        return
      }
    }
    catch (err) {
      console.error(`❌ Failed to import ${file}:`, err)
      return
    }

    await Promise.all(schemaKeys.map(async (key) => {
      const schema = schemas![key]
      if (!schema)
        return
      try {
        const schemaJson = toJsonSchema(schema, config)
        await writeSchemaJson(file, schemaJson, key)
      }
      catch (error) {
        console.error(`❌ Error converting schema for ${key} in ${file}:`, error)
      }
    }))
  }))
}

async function main() {
  // Find all schemas.ts files in ../src/**/schemas.ts

  const __dirname = import.meta.dirname

  const schemaFiles = await glob('../src/devices/**/schemas.ts', { absolute: true, cwd: __dirname,
  })
  if (!schemaFiles.length) {
    console.warn('No schemas.ts files found.')
    return
  }
  console.log(`Found ${schemaFiles.length} schemas.ts files.`)
  await compileSchemaFiles(schemaFiles)
}

main()
