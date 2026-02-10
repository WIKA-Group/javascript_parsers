import type { BaseIssue, BaseSchema, ObjectSchema } from 'valibot'
import type { MappedChannels } from '../types'
import * as v from 'valibot'

export function createGenericChannelSchema<TChannelAmount extends number, TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(
  channelAmount: TChannelAmount,
  channelSchema: () => TSchema,
): MappedChannels<TSchema> {
  const channels: Record<string, TSchema> = {}
  for (let i = 0; i < channelAmount; i++) {
    channels[`channel${i}`] = channelSchema()
  }
  return channels as MappedChannels<TSchema>
}

export function createParserDownlinkInputSchema(encodeEntries: {
  protocol: string
  schema: ObjectSchema<any, any> | v.VariantSchema<any, any, any>
}[]): v.VariantSchema<'protocol', any, any> {
  // verify that protocol values are unique
  const protocolSet = new Set<string>()
  for (const entry of encodeEntries) {
    if (protocolSet.has(entry.protocol)) {
      throw new Error(`Duplicate protocol in encode entries: ${entry.protocol}`)
    }
    protocolSet.add(entry.protocol)
  }

  const inputSchemas = encodeEntries.map(e => v.object({
    protocol: v.literal(e.protocol),
    input: e.schema,
  }))

  return v.variant('protocol', inputSchemas)
}
