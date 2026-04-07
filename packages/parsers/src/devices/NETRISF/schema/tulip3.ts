import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createTULIP3DownlinkSingleSchema } from '../../../schemas/tulip3/downlink'
import { createdTULIP3NETRISFDeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createNETRISFTULIP3UplinkOutputSchema() {
  const NETRISF_TULIP3_PROFILE = createdTULIP3NETRISFDeviceProfile()
  return createTULIP3UplinkOutputSchema(NETRISF_TULIP3_PROFILE.sensorChannelConfig)
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createNETRISFTULIP3DownlinkInputSchema() {
  const NETRISF_TULIP3_PROFILE = createdTULIP3NETRISFDeviceProfile()
  return createTULIP3DownlinkSingleSchema(NETRISF_TULIP3_PROFILE.sensorChannelConfig)
}
