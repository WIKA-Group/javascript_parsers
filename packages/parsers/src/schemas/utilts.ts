import type { BaseIssue, BaseSchema } from 'valibot'
import type { MappedChannels } from '../types'

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
