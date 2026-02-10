import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createTULIP3DownlinkSingleSchema } from '../../../schemas/tulip3/downlink'
import { createdTULIP3PEWDeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createPEWTULIP3UplinkOutputSchema() {
  const PEW_TULIP3_PROFILE = createdTULIP3PEWDeviceProfile()
  return createTULIP3UplinkOutputSchema(PEW_TULIP3_PROFILE.sensorChannelConfig)
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createPEWTULIP3DownlinkInputSchema() {
  const PEW_TULIP3_PROFILE = createdTULIP3PEWDeviceProfile()
  return createTULIP3DownlinkSingleSchema(PEW_TULIP3_PROFILE.sensorChannelConfig)
}
