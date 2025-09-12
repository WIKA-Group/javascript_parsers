import { NETRIS1_NAME } from '..'
import { defaultChannelAlarmFlags, defaultCommunicationModuleAlarmFlags, defaultSensorAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createdTULIP3NETRIS1DeviceProfile() {
  return defineTULIP3DeviceProfile({
    deviceName: NETRIS1_NAME,
    deviceAlarmConfig: {
      communicationModuleAlarms: defaultCommunicationModuleAlarmFlags,
      sensorAlarms: defaultSensorAlarmFlags,
      sensorChannelAlarms: defaultChannelAlarmFlags,
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
