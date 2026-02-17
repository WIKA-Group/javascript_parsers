/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createTULIP2NETRIS1Channels, NETRIS1_DOWNLINK_FEATURE_FLAGS } from '../parser/tulip2/constants'
import { createNETRIS1TULIP2GetConfigurationSchema, createNETRIS1TULIP2ResetBatterySchema, createNETRIS1TULIP2UplinkOutputSchema } from './tulip2'
import { createNETRIS1TULIP3DownlinkInputSchema, createNETRIS1TULIP3UplinkOutputSchema } from './tulip3'

export function createNETRIS1UplinkOutputSchema() {
  return v.union([
    createUplinkOutputFailureSchema(),
    createNETRIS1TULIP3UplinkOutputSchema(),
    createNETRIS1TULIP2UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createNETRIS1UplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createTULIP2NETRIS1Channels(),
        NETRIS1_DOWNLINK_FEATURE_FLAGS,
        [createNETRIS1TULIP2GetConfigurationSchema(), createNETRIS1TULIP2ResetBatterySchema()],
      ),
    },
    {
      protocol: 'TULIP3',
      schema: createNETRIS1TULIP3DownlinkInputSchema(),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
