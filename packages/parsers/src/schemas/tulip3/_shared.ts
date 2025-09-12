/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { configurationStatusLookup } from '../../codecs/tulip3/lookups'

export function createConfigurationStatusSchema() {
  return v.picklist(Object.values(configurationStatusLookup) as (typeof configurationStatusLookup[keyof typeof configurationStatusLookup])[])
}

export function createFrameSchema() {
  return v.object({
    frameNumber: v.number(),
    status: createConfigurationStatusSchema(),
  })
}

/**
 * Creates a generic uplink output schema with the specified message type, subtype, and extension.
 * @internal
 */
export function createGenericUplinkOutputSchema<const TType extends [number, ...number[]], const TSubType extends [number, ...number[]], const TObjectExtension extends v.ObjectEntries>(i: {
  messageType: TType
  messageSubType: TSubType
  extension: TObjectExtension
}) {
  return v.object({
    data: v.object({
      messageType: v.picklist(i.messageType),
      messageSubType: v.picklist(i.messageSubType),
      ...i.extension,
    }),
    warnings: v.optional(v.array(v.string())),
  })
}

export function createWriteResponseDataSchema() {
  return v.object({
    revisionCounter: v.optional(v.number()),
    totalWrongFrames: v.optional(v.number()),
    frames: v.tupleWithRest([createFrameSchema()], createFrameSchema()),
  })
}
