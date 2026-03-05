/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createDownlinkResetBatteryIndicatorSchema, createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createGD20WTULIP2Channels, GD20W_DOWNLINK_FEATURE_FLAGS } from '../parser/tulip2/constants'
import { createGD20WTULIP2GetConfigurationSchema, createGD20WTULIP2UplinkOutputSchema } from './tulip2'

export function createGD20WUplinkOutputSchema() {
  return v.union([
    createGD20WTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createGD20WUplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createGD20WTULIP2Channels(),
        GD20W_DOWNLINK_FEATURE_FLAGS,
        [
          createDownlinkResetBatteryIndicatorSchema(GD20W_DOWNLINK_FEATURE_FLAGS),
          createGD20WTULIP2GetConfigurationSchema(),
        ],
      ),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
