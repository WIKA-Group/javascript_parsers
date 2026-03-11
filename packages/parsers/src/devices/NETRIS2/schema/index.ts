/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createDownlinkResetBatteryIndicatorSchema, createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import {
  createTULIP2NETRIS2Channels,
  NETRIS2_DOWNLINK_FEATURE_FLAGS,
  NETRIS2_DOWNLINK_SPAN_LIMIT_FACTORS,
} from '../parser/tulip2/constants'
import { createNETRIS2TULIP2UplinkOutputSchema } from './tulip2/uplink'
import { createNETRIS2TULIP3DownlinkInputSchema, createNETRIS2TULIP3UplinkOutputSchema } from './tulip3'

export function createNETRIS2UplinkOutputSchema() {
  return v.union([
    createNETRIS2TULIP3UplinkOutputSchema(),
    createNETRIS2TULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createNETRIS2UplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createTULIP2NETRIS2Channels(),
        NETRIS2_DOWNLINK_FEATURE_FLAGS,
        [createDownlinkResetBatteryIndicatorSchema(NETRIS2_DOWNLINK_FEATURE_FLAGS)],
        NETRIS2_DOWNLINK_SPAN_LIMIT_FACTORS,
      ),
    },
    {
      protocol: 'TULIP3',
      schema: createNETRIS2TULIP3DownlinkInputSchema(),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
