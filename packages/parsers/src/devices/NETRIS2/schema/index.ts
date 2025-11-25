/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTULIP2DownlinkSchema } from '../../../schemas/tulip2/downlink'
import { createTULIP2NETRIS2Channels, NETRIS2_DOWNLINK_FEATURE_FLAGS } from '../parser/tulip2/constants'
import { createNETRIS2TULIP2UplinkOutputSchema } from './tulip2/uplink'

export function createNETRIS2UplinkOutputSchema() {
  return v.union([
    createNETRIS2TULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createNETRIS2UplinkOutputSchema

const DownlinkInputSchema = () => createTULIP2DownlinkSchema(createTULIP2NETRIS2Channels(), NETRIS2_DOWNLINK_FEATURE_FLAGS)

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
