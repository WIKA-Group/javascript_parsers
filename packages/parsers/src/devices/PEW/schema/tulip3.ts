import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createdTULIP3PEWDeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createPEWTULIP3UplinkOutputSchema() {
  const PEW_TULIP3_PROFILE = createdTULIP3PEWDeviceProfile()
  return createTULIP3UplinkOutputSchema(PEW_TULIP3_PROFILE.sensorChannelConfig, PEW_TULIP3_PROFILE.deviceAlarmConfig.communicationModuleAlarms, PEW_TULIP3_PROFILE.deviceAlarmConfig.sensorAlarms, PEW_TULIP3_PROFILE.deviceAlarmConfig.sensorChannelAlarms)
}
