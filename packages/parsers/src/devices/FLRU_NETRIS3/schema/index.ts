/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createTULIP2FLRUChannels } from '../parser/tulip2/channels'
import { FLRU_DOWNLINK_FEATURE_FLAGS, FLRU_DOWNLINK_SPAN_LIMIT_FACTORS } from '../parser/tulip2/constants'
import { createFLRUTULIP2UplinkOutputSchema } from './tulip2'
import { createFLRUTULIP3UplinkOutputSchema } from './tulip3'

export function createFLRUUplinkOutputSchema() {
  return v.union([
    createFLRUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createFLRUTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createFLRUUplinkOutputSchema

const TULIP2_FLRU_CHANNELS = createTULIP2FLRUChannels()

function createFLRUTULIP2DownlinkInputSchema() {
  return createTULIP2DownlinkSchema(
    TULIP2_FLRU_CHANNELS,
    FLRU_DOWNLINK_FEATURE_FLAGS,
    undefined,
    FLRU_DOWNLINK_SPAN_LIMIT_FACTORS,
  )
}

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createFLRUTULIP2DownlinkInputSchema(),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
