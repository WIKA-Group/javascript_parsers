/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createDownlinkResetBatteryIndicatorSchema, createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createTULIP2PEWChannels, PEW_DOWNLINK_FEATURE_FLAGS } from '../parser/tulip2/constants'
import { createPEWTULIP2DropConfigurationSchema, createPEWTULIP2GetConfigurationSchema, createPEWTULIP2UplinkOutputSchema } from './tulip2'
import { createPEWTULIP3DownlinkInputSchema, createPEWTULIP3UplinkOutputSchema } from './tulip3'

export function createPEWUplinkOutputSchema() {
  return v.union([
    createPEWTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createPEWTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createPEWUplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createTULIP2PEWChannels(),
        PEW_DOWNLINK_FEATURE_FLAGS,
        [createDownlinkResetBatteryIndicatorSchema(PEW_DOWNLINK_FEATURE_FLAGS), createPEWTULIP2DropConfigurationSchema(), createPEWTULIP2GetConfigurationSchema()],
      ),
    },
    {
      protocol: 'TULIP3',
      schema: createPEWTULIP3DownlinkInputSchema(),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
