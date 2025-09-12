import { NETRIS1_NAME } from '..'
import { defaultChannelAlarmFlags, defaultCommunicationModuleAlarmFlags, defaultSensorAlarmFlags, defineDeviceAlarmFlags, pickDeviceAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const netris1CommunicationModuleAlarmFlags = pickDeviceAlarmFlags(defaultCommunicationModuleAlarmFlags, ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const netris1SensorAlarmFlags = defineDeviceAlarmFlags(pickDeviceAlarmFlags(defaultSensorAlarmFlags, ['sensorCommunicationError', 'sensorInternalError']), {
  sensorIdentificationError: 0b1000_0000_0000_0000,
})

const netris1ChannelAlarmFlags = defaultChannelAlarmFlags

// eslint-disable-next-line ts/explicit-function-return-type
export function createdTULIP3NETRIS1DeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: NETRIS1_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: netris1CommunicationModuleAlarmFlags,
      sensorAlarms: netris1SensorAlarmFlags,
      sensorChannelAlarms: netris1ChannelAlarmFlags,
    },
    sensorChannelConfig: {
      sensor1: {
        channel1: {
          channelName: 'measurement',
          start: 0, // placeholder; actual range comes from device config at runtime
          end: 10, // placeholder; actual range comes from device config at runtime
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        },
      },
    },
  })
}

export {}
