/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createTULIP2TRUChannels } from '../parser/tulip2/channels'
import { TRU_DOWNLINK_FEATURE_FLAGS, TRU_DOWNLINK_SPAN_LIMIT_FACTORS } from '../parser/tulip2/constants'
import { createTRUTULIP2UplinkOutputSchema } from './tulip2'
import { createTRUTULIP3DownlinkInputSchema, createTRUTULIP3UplinkOutputSchema } from './tulip3'

export function createTRUUplinkOutputSchema() {
  return v.union([
    createTRUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createTRUTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createTRUUplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createTULIP2TRUChannels(),
        TRU_DOWNLINK_FEATURE_FLAGS,
        undefined,
        TRU_DOWNLINK_SPAN_LIMIT_FACTORS,
      ),
    },
    {
      protocol: 'TULIP3',
      schema: createTRUTULIP3DownlinkInputSchema(),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
