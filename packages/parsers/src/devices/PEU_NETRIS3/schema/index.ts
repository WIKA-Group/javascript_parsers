/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createTULIP2PEUChannels } from '../parser/tulip2/channels'
import { PEU_DOWNLINK_FEATURE_FLAGS, PEU_DOWNLINK_SPAN_LIMIT_FACTORS } from '../parser/tulip2/constants'
import { createPEUTULIP2UplinkOutputSchema } from './tulip2'
import { createPEUTULIP3DownlinkInputSchema, createPEUTULIP3UplinkOutputSchema } from './tulip3'

export function createPEUUplinkOutputSchema() {
  return v.union([
    createPEUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createPEUTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createPEUUplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createTULIP2PEUChannels(),
        PEU_DOWNLINK_FEATURE_FLAGS,
        undefined,
        PEU_DOWNLINK_SPAN_LIMIT_FACTORS,
      ),
    },
    {
      protocol: 'TULIP3',
      schema: createPEUTULIP3DownlinkInputSchema(),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
