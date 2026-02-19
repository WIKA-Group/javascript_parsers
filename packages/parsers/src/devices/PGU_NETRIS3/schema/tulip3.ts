import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createTULIP3DownlinkSingleSchema } from '../../../schemas/tulip3/downlink'
import { createTULIP3PGUDeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createPGUTULIP3UplinkOutputSchema() {
  const PGU_TULIP3_PROFILE = createTULIP3PGUDeviceProfile()
  return createTULIP3UplinkOutputSchema(PGU_TULIP3_PROFILE.sensorChannelConfig)
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createPGUTULIP3DownlinkInputSchema() {
  const PGU_TULIP3_PROFILE = createTULIP3PGUDeviceProfile()
  return createTULIP3DownlinkSingleSchema(PGU_TULIP3_PROFILE.sensorChannelConfig)
}
