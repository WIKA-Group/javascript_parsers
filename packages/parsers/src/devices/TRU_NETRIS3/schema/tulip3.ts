import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createTULIP3DownlinkSingleSchema } from '../../../schemas/tulip3/downlink'
import { createTULIP3TRUDeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTRUTULIP3UplinkOutputSchema() {
  const TRU_TULIP3_PROFILE = createTULIP3TRUDeviceProfile()
  return createTULIP3UplinkOutputSchema(TRU_TULIP3_PROFILE.sensorChannelConfig)
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createTRUTULIP3DownlinkInputSchema() {
  const TRU_TULIP3_PROFILE = createTULIP3TRUDeviceProfile()
  return createTULIP3DownlinkSingleSchema(TRU_TULIP3_PROFILE.sensorChannelConfig)
}
