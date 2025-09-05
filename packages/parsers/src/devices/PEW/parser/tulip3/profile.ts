import { PEW_NAME } from '..'
import { defaultChannelAlarmFlags, defaultCommunicationModuleAlarmFlags, defaultSensorAlarmFlags } from '../../../../codecs/tulip3/messages/deviceAlarm'
import { defineTULIP3DeviceProfile } from '../../../../codecs/tulip3/profile'

export const PEW_TULIP3_PROFILE = defineTULIP3DeviceProfile({
  deviceName: PEW_NAME,
  deviceAlarmConfig: {
    communicationModuleAlarms: defaultCommunicationModuleAlarmFlags,
    sensorAlarms: defaultSensorAlarmFlags,
    sensorChannelAlarms: defaultChannelAlarmFlags,
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
