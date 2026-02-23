/* eslint-disable ts/explicit-function-return-type */
import type { TULIP2Channel } from '../../../codecs/tulip2'
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createTRWTULIP2GetConfigurationSchema, createTRWTULIP2ResetBatterySchema, createTRWTULIP2UplinkOutputSchema } from './tulip2'
import { createTRWTULIP3DownlinkInputSchema, createTRWTULIP3UplinkOutputSchema } from './tulip3'

const TRW_DOWNLINK_FEATURE_FLAGS = {
  maxConfigId: 31,
  channelsStartupTime: false,
  channelsMeasureOffset: false,
  mainConfigBLE: false,
  mainConfigSingleMeasuringRate: false,
} as const

function createTRWSchemaChannels() {
  return [{
    channelId: 0,
    name: 'temperature',
    start: 0 as number,
    end: 10 as number,
  }] as const satisfies TULIP2Channel[]
}

export function createTRWUplinkOutputSchema() {
  return v.union([
    createUplinkOutputFailureSchema(),
    createTRWTULIP3UplinkOutputSchema(),
    createTRWTULIP2UplinkOutputSchema(),
  ])
}

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP2',
      schema: createTULIP2DownlinkSchema(
        createTRWSchemaChannels(),
        TRW_DOWNLINK_FEATURE_FLAGS,
        [createTRWTULIP2GetConfigurationSchema(), createTRWTULIP2ResetBatterySchema()],
      ),
    },
    {
      protocol: 'TULIP3',
      schema: createTRWTULIP3DownlinkInputSchema(),
    },
  ])
}

const UplinkOutputSchema = createTRWUplinkOutputSchema

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
