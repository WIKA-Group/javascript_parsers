// NETRIS1 tulip3 schema stub (to be implemented during migration)
import { createTULIP3UplinkOutputSchema } from '../../../schemas/tulip3'
import { createdTULIP3NETRIS1DeviceProfile } from '../parser/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createNETRIS1TULIP3UplinkOutputSchema() {
  const NETRIS1_TULIP3_PROFILE = createdTULIP3NETRIS1DeviceProfile()
  return createTULIP3UplinkOutputSchema(
    NETRIS1_TULIP3_PROFILE.sensorChannelConfig,
    NETRIS1_TULIP3_PROFILE.deviceAlarmConfig.communicationModuleAlarms,
    NETRIS1_TULIP3_PROFILE.deviceAlarmConfig.sensorAlarms,
    NETRIS1_TULIP3_PROFILE.deviceAlarmConfig.sensorChannelAlarms,
  )
}
