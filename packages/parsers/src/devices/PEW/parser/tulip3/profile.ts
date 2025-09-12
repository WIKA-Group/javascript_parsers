import { PEW_NAME } from '..'
import { defaultChannelAlarmFlags, defaultCommunicationModuleAlarmFlags, defaultSensorAlarmFlags, defineDeviceAlarmFlags, pickDeviceAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

const pewCommunicationModuleAlarmFlags = pickDeviceAlarmFlags(defaultCommunicationModuleAlarmFlags, ['lowVoltage', 'airTimeLimitation', 'memoryError'])

const pewSensorAlarmFlags = defineDeviceAlarmFlags(pickDeviceAlarmFlags(defaultSensorAlarmFlags, ['sensorCommunicationError']), {
  sensorBusy: 0b1000_0000_0000_0000,
  sensorMemoryIntegrity: 0b0100_0000_0000_0000,
  sensorALUSaturation: 0b0010_0000_0000_0000,
})

const pewChannelAlarmFlags = pickDeviceAlarmFlags(defaultChannelAlarmFlags, ['outOfMaxPhysicalSensorLimit', 'outOfMinPhysicalSensorLimit'])

// eslint-disable-next-line ts/explicit-function-return-type
export function createdTULIP3PEWDeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: PEW_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: pewCommunicationModuleAlarmFlags,
      sensorAlarms: pewSensorAlarmFlags,
      sensorChannelAlarms: pewChannelAlarmFlags,
    },
    sensorChannelConfig: {
      sensor1: {
        channel1: {
          channelName: 'pressure',
          start: 0,
          end: 10,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        },
        channel2: {
          channelName: 'device temperature',
          start: -45,
          end: 110,
          measurementTypes: ['uint16 - TULIP scale 2500 - 12500'],
        },
      },
    },
  })
}
