// NETRIS1 tulip3 schema stub (to be implemented during migration)
import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createTULIP3DownlinkSingleSchema } from '../../../schemas/tulip3/downlink'
import { createdTULIP3NETRIS1DeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createNETRIS1TULIP3UplinkOutputSchema() {
  const NETRIS1_TULIP3_PROFILE = createdTULIP3NETRIS1DeviceProfile()
  return createTULIP3UplinkOutputSchema(
    NETRIS1_TULIP3_PROFILE.sensorChannelConfig,
  )
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createNETRIS1TULIP3DownlinkInputSchema() {
  const NETRIS1_TULIP3_PROFILE = createdTULIP3NETRIS1DeviceProfile()
  return createTULIP3DownlinkSingleSchema(NETRIS1_TULIP3_PROFILE.sensorChannelConfig)
}
