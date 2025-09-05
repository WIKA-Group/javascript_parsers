import type { ChannelAlarmData, ChannelAlarmMessageUplinkOutput, CommunicationModuleAlarmMessageUplinkOutput, SensorAlarmData, SensorAlarmMessageUplinkOutput } from '../../../schemas/tulip3/deviceAlarm'
import type { DeviceAlarmFlags, TULIP3ChannelConfig, TULIP3DeviceSensorConfig } from '../profile'
import { validateMessageHeader } from '.'

export const defaultCommunicationModuleAlarmFlags = defineDeviceAlarmFlags({
  localUserAccessDenied: 0b0000_0000_0000_0001,
  cmChipLowTemperature: 0b0000_0000_0000_0010,
  cmChipHighTemperature: 0b0000_0000_0000_0100,
  airTimeLimitation: 0b0000_0000_0000_1000,
  memoryError: 0b0000_0000_0001_0000,
  lowVoltage: 0b0000_0000_0001_0000,
  highVoltage: 0b000_0000_0010_0000,
})

export const defaultSensorAlarmFlags = defineDeviceAlarmFlags({
  sensorCommunicationError: 0b0000_0000_0000_0001,
  sensorNotSupported: 0b0000_0000_0000_0010,
})

export const defaultChannelAlarmFlags = defineDeviceAlarmFlags({
  shortCondition: 0b0000_0000_0000_0001,
  openCondition: 0b0000_0000_0000_0010,
  outOfMinMeasurementRange: 0b0000_0000_0000_0100,
  outOfMaxMeasurementRange: 0b0000_0000_0000_1000,
  outOfMinPhysicalSensorLimit: 0b0000_0000_0001_0000,
  outOfMaxPhysicalSensorLimit: 0b0000_0000_0010_0000,
})

type MergedFlags<TDeviceAlarmFlags extends DeviceAlarmFlags, TMergeFlags extends DeviceAlarmFlags> = {
  [Key in (keyof TDeviceAlarmFlags | Exclude<keyof TMergeFlags, keyof TDeviceAlarmFlags>)]: Key extends keyof TDeviceAlarmFlags
    ? TDeviceAlarmFlags[Key]
    : Key extends keyof TMergeFlags
      ? TMergeFlags[Key]
      : never
}

export function defineDeviceAlarmFlags<const TDeviceAlarmFlags extends DeviceAlarmFlags>(flagsConfig: TDeviceAlarmFlags): TDeviceAlarmFlags
export function defineDeviceAlarmFlags<const TDeviceAlarmFlags extends DeviceAlarmFlags, const TMergeFlags extends DeviceAlarmFlags>(
  flagsConfig: TDeviceAlarmFlags,
  merge: TMergeFlags,
): MergedFlags<TDeviceAlarmFlags, TMergeFlags>
export function defineDeviceAlarmFlags<const TDeviceAlarmFlags extends DeviceAlarmFlags, const TMergeFlags extends DeviceAlarmFlags>(
  flagsConfig: TDeviceAlarmFlags,
  merge?: TMergeFlags,
): (MergedFlags<TDeviceAlarmFlags, TMergeFlags>) | TDeviceAlarmFlags {
  return { ...merge ?? {}, ...flagsConfig }
}

/**
 * Creates alarm flags object from a bitfield value using the provided flags configuration.
 */
function createAlarmFlagsFromBitfield<TDeviceAlarmFlags extends DeviceAlarmFlags>(
  bitfield: number,
  flagsConfig: TDeviceAlarmFlags,
): Record<keyof TDeviceAlarmFlags, boolean> {
  const result = {} as Record<keyof TDeviceAlarmFlags, boolean>

  for (const [flagName, bitPosition] of Object.entries(flagsConfig)) {
    result[flagName as keyof TDeviceAlarmFlags] = Boolean(bitfield & bitPosition)
  }

  return result
}/**
  * Decodes communication module alarm uplink message (message type 0x13, subtype 0x01).
  *
  * Behavior:
  * - Sent when an alarm appears or turns off
  * - Sent on cloud request
  * - Alarms always enabled
  * - Requires network server acknowledgement
  *
  * Payload:
  * - data[0]: 0x13 (message type)
  * - data[1]: 0x01 (sub message type)
  * - data[2-3]: 16-bit alarm flags bitfield (bits 6-0 used)
  *
  * @param data raw byte array from uplink payload
  * @param communicationModuleAlarmFlags configuration mapping alarm flag names to bit positions
  * @returns Decoded DeviceAlarmMessageUplinkOutput
  */
export function decodeCommunicationModuleAlarmMessage<TDeviceAlarmFlags extends DeviceAlarmFlags>(
  data: number[],
  communicationModuleAlarmFlags: TDeviceAlarmFlags,
): CommunicationModuleAlarmMessageUplinkOutput<TDeviceAlarmFlags> {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x13,
    allowedSubTypes: [0x01],
    minLength: 4,
    messageTypeName: 'Communication module alarm',
  })

  if (data.length !== 4) {
    throw new RangeError(`Invalid data length for device alarm message: expected 4 but got ${data.length}`)
  }

  // Combine two bytes into 16-bit field
  const alarmType = (data[2]! << 8) | data[3]!
  return {
    data: {
      messageType,
      messageSubType,
      communicationModuleAlarms: {
        alarmFlags: createAlarmFlagsFromBitfield(alarmType, communicationModuleAlarmFlags),
      },
    },
  } as CommunicationModuleAlarmMessageUplinkOutput<TDeviceAlarmFlags>
}

/**
 * Decodes sensor alarm uplink message (message type 0x13, subtype 0x02).
 *
 * Behavior:
 * - Sent when a sensor alarm appears or turns off; affected sensors included
 * - Sent on cloud request for all or selected sensors
 * - Sensor alarms are always enabled and cannot be configured by the end-user
 * - Requires network server acknowledgement
 *
 * Payload:
 * - data[0]: 0x13 (message type)
 * - data[1]: 0x02 (sub message type)
 * - data[2]: Sensor ID byte (bits 7-6: sensor ID 0-3, bits 5-0: RFU)
 * - data[3-4]: 16-bit alarm type bitfield (bits 1-0 used, bits 15-2: RFU)
 * - Additional sensor entries follow the same pattern
 *
 * @param data raw byte array from uplink payload
 * @param config sensor configuration to determine valid sensors
 * @param sensorAlarmFlags configuration mapping sensor alarm flag names to bit positions
 * @returns Decoded SensorAlarmMessageUplinkOutput
 * @template TTULIP3DeviceSensorConfig - Type-safe sensor configuration
 * @template TDeviceAlarmFlags - Type-safe alarm flags configuration
 */
export function decodeSensorAlarmMessage<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, const TDeviceAlarmFlags extends DeviceAlarmFlags>(
  data: number[],
  config: TTULIP3DeviceSensorConfig,
  sensorAlarmFlags: TDeviceAlarmFlags,
): SensorAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags> {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x13,
    allowedSubTypes: [0x02],
    minLength: 5,
    messageTypeName: 'Sensor alarm',
  })

  // Parse entries directly from payload starting at index 2
  let currentIndex = 2
  const sensorAlarms: Array<SensorAlarmData<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>[number]> = []

  while (currentIndex < data.length) {
    // Need at least 3 bytes for a full entry (sensor ID + 2 alarm type bytes)
    if (currentIndex + 2 >= data.length) {
      throw new RangeError(`Not enough data left to finish reading sensor alarm entry. Expected 3 bytes but got ${data.length - currentIndex}. currentIndex ${currentIndex}`)
    }

    const sensorIdByte = data[currentIndex]!
    const alarmTypeHigh = data[currentIndex + 1]!
    const alarmTypeLow = data[currentIndex + 2]!

    // Extract sensor ID from bits 7-6 of the sensor ID byte
    const sensorId = (sensorIdByte >> 6) & 0b11
    const sensorKey = `sensor${sensorId + 1}` as keyof TTULIP3DeviceSensorConfig

    // Validate that this sensor exists in the configuration
    if (!config[sensorKey]) {
      throw new TypeError(`Sensor alarm for ${String(sensorKey)} is not supported by the device profile.`)
    }

    // Combine alarm type bytes (little endian: low byte first, high byte second)
    const alarmType = (alarmTypeHigh << 8) | alarmTypeLow

    sensorAlarms.push({
      sensor: sensorKey,
      sensorId,
      alarmFlags: createAlarmFlagsFromBitfield(alarmType, sensorAlarmFlags),
    } as SensorAlarmData<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>[number])

    currentIndex += 3
  }

  return {
    data: {
      messageType,
      messageSubType,
      sensorAlarms: sensorAlarms as SensorAlarmData<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>,
    },
  } as SensorAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>
}

/**
 * Decodes channel alarm uplink message (message type 0x13, subtype 0x03).
 *
 * Behavior:
 * - Sent when a channel alarm appears or turns off; affected channels included
 * - Sent on cloud request for all or selected channels
 * - Channel alarms are always enabled and cannot be configured by the end-user
 * - Disabled (not sampled) channels are also shown as inactive (false=0)
 * - Requires network server acknowledgement
 *
 * Payload:
 * - data[0]: 0x13 (message type)
 * - data[1]: 0x03 (sub message type)
 * - data[2]: Sensor ID / Channel ID byte (bits 7-6: sensor ID 0-3, bits 5-3: channel ID 0-7, bits 2-0: RFU)
 * - data[3-4]: 16-bit alarm type bitfield (bits 5-0 used, bits 15-6: RFU)
 * - Additional channel entries follow the same pattern
 *
 * @param data raw byte array from uplink payload
 * @param config sensor configuration to determine valid sensors and channels
 * @param channelAlarmFlags configuration mapping channel alarm flag names to bit positions
 * @returns Decoded ChannelAlarmMessageUplinkOutput
 * @template TTULIP3DeviceSensorConfig - Type-safe sensor configuration
 * @template TDeviceAlarmFlags - Type-safe alarm flags configuration
 */
export function decodeChannelAlarmMessage<const TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig, const TDeviceAlarmFlags extends DeviceAlarmFlags>(
  data: number[],
  config: TTULIP3DeviceSensorConfig,
  channelAlarmFlags: TDeviceAlarmFlags,
): ChannelAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags> {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x13,
    allowedSubTypes: [0x03],
    minLength: 5,
    messageTypeName: 'Channel alarm',
  })

  // Parse entries directly from payload starting at index 2
  let currentIndex = 2
  const channelAlarms: Array<ChannelAlarmData<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>[number]> = []

  while (currentIndex < data.length) {
    // Need at least 3 bytes for a full entry (sensor/channel ID + 2 alarm type bytes)
    if (currentIndex + 2 >= data.length) {
      throw new RangeError(`Not enough data left to finish reading channel alarm entry. Expected 3 bytes but got ${data.length - currentIndex}. currentIndex ${currentIndex}`)
    }

    const sensorChannelIdByte = data[currentIndex]!
    const alarmTypeHigh = data[currentIndex + 1]!
    const alarmTypeLow = data[currentIndex + 2]!

    // Extract sensor ID from bits 7-6 and channel ID from bits 5-3
    const sensorId = (sensorChannelIdByte >> 6) & 0b11
    const channelId = (sensorChannelIdByte >> 3) & 0b111
    const sensorKey = `sensor${sensorId + 1}` as keyof TTULIP3DeviceSensorConfig
    const channelKey = `channel${channelId + 1}` as keyof NonNullable<TTULIP3DeviceSensorConfig[keyof TTULIP3DeviceSensorConfig]>

    // Validate that this sensor exists in the configuration
    if (!config[sensorKey]) {
      throw new TypeError(`Channel alarm for ${String(sensorKey)} is not supported by the device profile.`)
    }

    // Validate that this channel exists in the sensor configuration
    if (!config[sensorKey]![channelKey]) {
      throw new TypeError(`Channel alarm for ${String(sensorKey)}/${String(channelKey)} is not supported by the device profile.`)
    }

    const channelName = (config[sensorKey][channelKey] as any as TULIP3ChannelConfig).channelName

    // Combine alarm type bytes (little endian: low byte first, high byte second)
    const alarmType = (alarmTypeHigh << 8) | alarmTypeLow

    channelAlarms.push({
      sensor: sensorKey,
      sensorId,
      channel: channelKey,
      channelId,
      channelName,
      alarmFlags: createAlarmFlagsFromBitfield(alarmType, channelAlarmFlags),
    } as ChannelAlarmData<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>[number])

    currentIndex += 3
  }

  return {
    data: {
      messageType,
      messageSubType,
      channelAlarms: channelAlarms as ChannelAlarmData<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>,
    },
  } as ChannelAlarmMessageUplinkOutput<TTULIP3DeviceSensorConfig, TDeviceAlarmFlags>
}
