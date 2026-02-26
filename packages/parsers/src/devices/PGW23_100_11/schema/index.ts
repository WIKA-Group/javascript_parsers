/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createDownlinkResetBatteryIndicatorSchema, createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createTULIP2PGWChannels, PGW_DOWNLINK_FEATURE_FLAGS } from '../parser/tulip2/constants'
import { createPGW23_100_11TULIP2UplinkOutputSchema } from './tulip2'

export function createPGW23_100_11UplinkOutputSchema() {
  return v.union([
    createPGW23_100_11TULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createPGW23_100_11UplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createTULIP2PGWChannels(),
        PGW_DOWNLINK_FEATURE_FLAGS,
        [createDownlinkResetBatteryIndicatorSchema(PGW_DOWNLINK_FEATURE_FLAGS)],
      ),
    },
    // {
    //   protocol: 'TULIP3',
    //   schema: createPGW23_100_11TULIP3DownlinkInputSchema(),
    // },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
