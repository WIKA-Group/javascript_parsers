// TRW tulip3 schema
import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createTULIP3TRWDeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTRWTULIP3UplinkOutputSchema() {
  const TRW_TULIP3_PROFILE = createTULIP3TRWDeviceProfile()
  return createTULIP3UplinkOutputSchema(
    TRW_TULIP3_PROFILE.sensorChannelConfig,
  )
}
