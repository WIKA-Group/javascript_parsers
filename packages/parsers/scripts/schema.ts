import type { ConversionConfig } from '@valibot/to-json-schema'
import type { BaseIssue, BaseSchema } from 'valibot'
import { join } from 'node:path'
import { toJsonSchema } from '@valibot/to-json-schema'
import consola from 'consola'
import { writeFile } from 'fs-extra'
import { createJiti } from 'jiti'
import glob from 'tiny-glob'

type SchemaKey = 'UplinkOutputSchema' | 'DownlinkInputSchema'
type SchemaFactory = () => BaseSchema<unknown, unknown, BaseIssue<unknown>>

const OUTPUT_FILES = {
  UplinkOutputSchema: 'uplink.schema.json',
  DownlinkInputSchema: 'downlink.schema.json',
} as const

const files = await glob('../src/devices/**/schema/index.ts', { filesOnly: true, absolute: true, cwd: import.meta.dirname })

// To avoid failing when valibot cannot convert a schema, we set errorMode to 'warn' and log the issues.
// most likely to happen if you use e.g. min() or max() AFTER using integer() -> pipe(number(), integer(), min(0), max(100)) results in error
// pipe(number(), min(0), max(100), integer()) works fine
const toJsonSchemaConfig: ConversionConfig = { errorMode: 'warn' }

const jiti = createJiti(import.meta.url)

const ps = files.map(async (file) => {
  const imported = await jiti.import(file) as Record<SchemaKey, SchemaFactory | undefined>

  if (!imported.UplinkOutputSchema && !imported.DownlinkInputSchema) {
    consola.warn(`No schema factories found in ${file}, skipping`)
    return
  }

  const uplinkSchema = imported.UplinkOutputSchema?.()
  const downlinkSchema = imported.DownlinkInputSchema?.()

  const ps: Promise<void>[] = []

  if (uplinkSchema) {
    const writePath = join(file, '../..', OUTPUT_FILES.UplinkOutputSchema)
    const jsonSchema = toJsonSchema(uplinkSchema, toJsonSchemaConfig)

    const p = writeFile(writePath, JSON.stringify(jsonSchema, null, 2))
    ps.push(p)
  }

  if (downlinkSchema) {
    const writePath = join(file, '..', OUTPUT_FILES.DownlinkInputSchema)
    const jsonSchema = toJsonSchema(downlinkSchema, toJsonSchemaConfig)

    const p = writeFile(writePath, JSON.stringify(jsonSchema, null, 2))
    ps.push(p)
  }

  return Promise.all(ps).then(() => {
    consola.success(`Schemas written for ${file}`)
  }).catch((err) => {
    consola.error(`Error writing schemas for ${file}:`, err)
  })
}).flat()

await Promise.all(ps)

consola.info('Schema generation completed.')
