/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createTULIP2TGUChannels } from '../parser/tulip2/channels'
import { TGU_DOWNLINK_FEATURE_FLAGS, TGU_DOWNLINK_SPAN_LIMIT_FACTORS } from '../parser/tulip2/constants'
import { createTGUTULIP2UplinkOutputSchema } from './tulip2'
import { createTGUTULIP3DownlinkInputSchema, createTGUTULIP3UplinkOutputSchema } from './tulip3'

export function createTGUUplinkOutputSchema() {
  return v.union([
    createTGUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createTGUTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createTGUUplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createTULIP2TGUChannels(),
        TGU_DOWNLINK_FEATURE_FLAGS,
        undefined,
        TGU_DOWNLINK_SPAN_LIMIT_FACTORS,
      ),
    },
    {
      protocol: 'TULIP3',
      schema: createTGUTULIP3DownlinkInputSchema(),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
