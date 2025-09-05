import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { PEW_TULIP3_PROFILE } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createPEWTULIP3UplinkOutputSchema() {
  return createTULIP3UplinkOutputSchema(PEW_TULIP3_PROFILE.sensorChannelConfig, PEW_TULIP3_PROFILE.deviceAlarmConfig.communicationModuleAlarms, PEW_TULIP3_PROFILE.deviceAlarmConfig.sensorAlarms, PEW_TULIP3_PROFILE.deviceAlarmConfig.sensorChannelAlarms)
}
