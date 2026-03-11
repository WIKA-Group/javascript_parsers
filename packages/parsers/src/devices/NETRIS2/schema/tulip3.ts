import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createTULIP3DownlinkSingleSchema } from '../../../schemas/tulip3/downlink'
import { createdTULIP3NETRIS2DeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createNETRIS2TULIP3UplinkOutputSchema() {
  const NETRIS2_TULIP3_PROFILE = createdTULIP3NETRIS2DeviceProfile()
  return createTULIP3UplinkOutputSchema(NETRIS2_TULIP3_PROFILE.sensorChannelConfig)
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createNETRIS2TULIP3DownlinkInputSchema() {
  const NETRIS2_TULIP3_PROFILE = createdTULIP3NETRIS2DeviceProfile()
  return createTULIP3DownlinkSingleSchema(NETRIS2_TULIP3_PROFILE.sensorChannelConfig)
}
