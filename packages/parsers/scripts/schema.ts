import type { Config, Schema } from 'ts-json-schema-generator'
import fg from 'fast-glob'
import { writeFile } from 'fs-extra'
import { createGenerator } from 'ts-json-schema-generator'

const files = fg.globSync('../src/**/index.ts', {
  absolute: true,
  cwd: __dirname,
})

async function compileFiles(tsFiles: string[]) {
  const ps = tsFiles.map((file) => {
    const uplinkConfig: Config = {
      path: file,
      strictTuples: true,
      additionalProperties: false,
      skipTypeCheck: true,
      type: 'UplinkOutput',
    }

    const downlinkConfig: Config = {
      path: file,
      strictTuples: true,
      additionalProperties: false,
      skipTypeCheck: true,
      type: 'DownlinkInput',
    }

    const uplinkSchema = createGenerator(uplinkConfig).createSchema(uplinkConfig.type)

    let downlinkSchema: Schema | undefined

    try {
      downlinkSchema = createGenerator(downlinkConfig).createSchema(downlinkConfig.type)
    }
    catch {
      // type not found
    }

    const uplinkSchemaPath = file.replace('index.ts', 'uplink.schema.json')
    const downlinkSchemaPath = file.replace('index.ts', 'downlink.schema.json')

    return [
      uplinkSchema ? writeFile(uplinkSchemaPath, JSON.stringify(uplinkSchema, null, 2)) : undefined,
      downlinkSchema ? writeFile(downlinkSchemaPath, JSON.stringify(downlinkSchema, null, 2)) : undefined,
    ].filter(Boolean)
  })
  await Promise.all(ps.flat())
}

await compileFiles(files)
