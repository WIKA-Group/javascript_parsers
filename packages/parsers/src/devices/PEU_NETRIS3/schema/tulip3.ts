import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createTULIP3DownlinkSingleSchema } from '../../../schemas/tulip3/downlink'
import { createTULIP3PEUDeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createPEUTULIP3UplinkOutputSchema() {
  const PEU_TULIP3_PROFILE = createTULIP3PEUDeviceProfile()
  return createTULIP3UplinkOutputSchema(PEU_TULIP3_PROFILE.sensorChannelConfig)
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createPEUTULIP3DownlinkInputSchema() {
  const PEU_TULIP3_PROFILE = createTULIP3PEUDeviceProfile()
  return createTULIP3DownlinkSingleSchema(PEU_TULIP3_PROFILE.sensorChannelConfig)
}
