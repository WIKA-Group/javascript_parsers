import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createTULIP3FLRUDeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createFLRUTULIP3UplinkOutputSchema() {
  const FLRU_TULIP3_PROFILE = createTULIP3FLRUDeviceProfile()
  return createTULIP3UplinkOutputSchema(FLRU_TULIP3_PROFILE.sensorChannelConfig)
}
