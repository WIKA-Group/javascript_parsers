import type { ProcessAlarmData, ProcessAlarmMessageUplinkOutput } from '../../../schemas/tulip3/processAlarm'
import type { TULIP3DeviceSensorConfig, TULIP3SensorChannelConfig } from '../profile'
import { validateMessageHeader } from '.'

export function decodeProcessAlarmMessage<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig>(data: number[], deviceSensorConfig: TTULIP3DeviceSensorConfig): ProcessAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig> {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x12,
    allowedSubTypes: [0x01],
    minLength: 4, // Need at least 2 bytes for header + 2 bytes for one alarm entry
    messageTypeName: 'Process alarm',
  })

  // Parse entries directly from payload starting at index 2
  let currentIndex = 2
  const alarmsParsed: Array<ProcessAlarmData<TTULIP3DeviceSensorConfig>[number]> = []

  while (currentIndex < data.length) {
    // Need at least 2 bytes for a full entry (sensor/channel + alarm byte)
    if (currentIndex + 1 >= data.length) {
      throw new RangeError(`Not enough data left to finish reading process alarm entry. Expected 2 bytes but got ${data.length - currentIndex}. currentIndex ${currentIndex}`)
    }

    const idByte = data[currentIndex]!
    const alarmByte = data[currentIndex + 1]!

    // sensor id at bit 7 and 6
    const sensorId = (idByte & 0b1100_0000) >> 6
    // channel id at bit 5, 4 and 3
    const channelId = (idByte & 0b0011_1000) >> 3

    const sensor = `sensor${sensorId + 1}` as keyof TULIP3DeviceSensorConfig
    const channel = `channel${channelId + 1}` as keyof TULIP3SensorChannelConfig

    // Validate sensor/channel exist in config
    const cfg = deviceSensorConfig[sensor]?.[channel]
    if (!cfg) {
      throw new TypeError(`Process alarm for sensor ${sensor} channel ${channel} is not supported by the device profile.`)
    }

    alarmsParsed.push({
      sensor,
      sensorId,
      channel,
      channelId,
      channelName: cfg.channelName,
      alarmFlags: {
        lowThreshold: Boolean(alarmByte & 0b1000_0000), // bit 7
        highThreshold: Boolean(alarmByte & 0b0100_0000), // bit 6
        fallingSlope: Boolean(alarmByte & 0b0010_0000), // bit 5
        risingSlope: Boolean(alarmByte & 0b0001_0000), // bit 4
        lowThresholdWithDelay: Boolean(alarmByte & 0b0000_1000), // bit 3
        highThresholdWithDelay: Boolean(alarmByte & 0b0000_0100), // bit 2
      },
    } as ProcessAlarmData<TTULIP3DeviceSensorConfig>[number])
    currentIndex += 2
  }

  return {
    data: {
      messageType,
      messageSubType,
      processAlarms: alarmsParsed as ProcessAlarmData<TTULIP3DeviceSensorConfig>,
    },
  }
}
