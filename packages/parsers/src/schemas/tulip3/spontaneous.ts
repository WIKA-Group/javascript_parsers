/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { spontaneousStatusLookup } from '../../codecs/tulip3/lookups'
import { allowedTypeSubTypeCombinations } from '../../codecs/tulip3/messages/spontaneous'
import { createGenericUplinkOutputSchema } from './index'

type AllowedTypeCombinationsSchema = v.UnionSchema<{
  [K in keyof typeof allowedTypeSubTypeCombinations]: v.ObjectSchema<{
    type: v.LiteralSchema<K, undefined>
    subType: v.PicklistSchema<typeof allowedTypeSubTypeCombinations[K], undefined>
  }, undefined>
}[keyof typeof allowedTypeSubTypeCombinations][], undefined>

export function createAllowedTULIP3TypeSubTypeCombinationsSchema() {
  return v.union(
    Object.entries(allowedTypeSubTypeCombinations).map(([type, subTypes]) => {
      return v.object({
        type: v.literal(type),
        subType: v.picklist(subTypes),
      })
    }),
  ) as any as AllowedTypeCombinationsSchema
}

// Main spontaneous downlink answer data schema
// Two schema variants: with and without deviceErrorCode, depending on status

export function createSpontaneousDownlinkAnswerDataSchema() {
  const statusStrings = Object.values(spontaneousStatusLookup)
  const statusWithoutDeviceError = statusStrings.filter(s => s !== spontaneousStatusLookup[4])
  const statusWithDeviceError = spontaneousStatusLookup[4]
  return v.union([
    v.object({
      answeredDownlink: createAllowedTULIP3TypeSubTypeCombinationsSchema(),
      status: v.union(statusWithoutDeviceError.map(s => v.literal(s))),
      // deviceErrorCode must NOT be present
    }),
    v.object({
      answeredDownlink: createAllowedTULIP3TypeSubTypeCombinationsSchema(),
      status: v.literal(statusWithDeviceError),
      deviceErrorCode: v.number(),
    }),
  ])
}

export function createSpontaneousDownlinkAnswerUplinkOutputSchema() {
  return createGenericUplinkOutputSchema({
    messageType: [0x17],
    messageSubType: [0x01],
    extension: {
      spontaneousDownlinkAnswer: createSpontaneousDownlinkAnswerDataSchema(),
    },
  })
}

export type SpontaneousDownlinkAnswerUplinkOutput = v.InferOutput<ReturnType<typeof createSpontaneousDownlinkAnswerUplinkOutputSchema>>
export type AllowedTULIP3TypeSubTypeCombination = v.InferOutput<ReturnType<typeof createAllowedTULIP3TypeSubTypeCombinationsSchema>>
export type SpontaneousDownlinkAnswerData = v.InferOutput<ReturnType<typeof createSpontaneousDownlinkAnswerDataSchema>>

export function createSpontaneousFetchAdditionalDownlinkMessageSchema() {
  return createGenericUplinkOutputSchema({
    messageType: [0x17],
    messageSubType: [0x02],
    extension: {
    },
    // No additional data in this message
  })
}

export type SpontaneousFetchAdditionalDownlinkMessageUplinkOutput = v.InferOutput<ReturnType<typeof createSpontaneousFetchAdditionalDownlinkMessageSchema>>
