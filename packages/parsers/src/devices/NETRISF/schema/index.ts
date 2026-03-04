/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createDownlinkResetBatteryIndicatorSchema, createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createNetrisFTULIP2Channels, NETRISF_DOWNLINK_FEATURE_FLAGS } from '../parser/tulip2/constants'
import { createNetrisFTULIP2GetConfigurationSchema, createNetrisFTULIP2UplinkOutputSchema } from './tulip2'

export function createNetrisFUplinkOutputSchema() {
  return v.union([
    createNetrisFTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createNetrisFUplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createNetrisFTULIP2Channels(),
        NETRISF_DOWNLINK_FEATURE_FLAGS,
        [createDownlinkResetBatteryIndicatorSchema(NETRISF_DOWNLINK_FEATURE_FLAGS), createNetrisFTULIP2GetConfigurationSchema()],
      ),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
