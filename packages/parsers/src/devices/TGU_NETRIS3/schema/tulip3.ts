import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createTULIP3DownlinkSingleSchema } from '../../../schemas/tulip3/downlink'
import { createTULIP3TGUDeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTGUTULIP3UplinkOutputSchema() {
  const TGU_TULIP3_PROFILE = createTULIP3TGUDeviceProfile()
  return createTULIP3UplinkOutputSchema(TGU_TULIP3_PROFILE.sensorChannelConfig)
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createTGUTULIP3DownlinkInputSchema() {
  const TGU_TULIP3_PROFILE = createTULIP3TGUDeviceProfile()
  return createTULIP3DownlinkSingleSchema(TGU_TULIP3_PROFILE.sensorChannelConfig)
}
