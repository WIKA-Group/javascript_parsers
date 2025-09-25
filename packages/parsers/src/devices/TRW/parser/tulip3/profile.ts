import { TRW_NAME } from '..'
import { defaultChannelAlarmFlags, defaultCommunicationModuleAlarmFlags, defaultSensorAlarmFlags, defineDeviceAlarmFlags, pickDeviceAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const trwCommunicationModuleAlarmFlags = pickDeviceAlarmFlags(defaultCommunicationModuleAlarmFlags, ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const trwSensorAlarmFlags = defineDeviceAlarmFlags(pickDeviceAlarmFlags(defaultSensorAlarmFlags, ['sensorCommunicationError', 'sensorInternalError']), {
  sensorIdentificationError: 0b1000_0000_0000_0000,
})

const trwChannelAlarmFlags = defaultChannelAlarmFlags

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3TRWDeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: TRW_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: trwCommunicationModuleAlarmFlags,
      sensorAlarms: trwSensorAlarmFlags,
      sensorChannelAlarms: trwChannelAlarmFlags,
    },
    sensorChannelConfig: {
      sensor1: {
        channel1: {
          channelName: 'temperature',
          start: 0, // placeholder; actual range comes from device config at runtime
          end: 10, // placeholder; actual range comes from device config at runtime
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        },
      },
    },
  })
}

export {}
