/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createTULIP2PGUChannels } from '../parser/tulip2/channels'
import { PGU_DOWNLINK_FEATURE_FLAGS, PGU_DOWNLINK_SPAN_LIMIT_FACTORS } from '../parser/tulip2/constants'
import { createPGUTULIP2UplinkOutputSchema } from './tulip2'
import { createPGUTULIP3DownlinkInputSchema, createPGUTULIP3UplinkOutputSchema } from './tulip3'

export function createPGUUplinkOutputSchema() {
  return v.union([
    createPGUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createPGUTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createPGUUplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createTULIP2PGUChannels(),
        PGU_DOWNLINK_FEATURE_FLAGS,
        undefined,
        PGU_DOWNLINK_SPAN_LIMIT_FACTORS,
      ),
    },
    {
      protocol: 'TULIP3',
      schema: createPGUTULIP3DownlinkInputSchema(),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
