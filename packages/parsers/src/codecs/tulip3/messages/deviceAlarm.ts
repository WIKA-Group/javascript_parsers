import type { ChannelAlarmData, ChannelAlarmMessageUplinkOutput, CommunicationModuleAlarmMessageUplinkOutput, SensorAlarmData, SensorAlarmMessageUplinkOutput } from '../../../schemas/tulip3/deviceAlarm'
import type { AlarmFlags, TULIP3ChannelConfig, TULIP3DeviceConfig, TULIP3SensorConfig } from '../profile'
import { validateMessageHeader } from '.'

// eslint-disable-next-line ts/explicit-function-return-type
export function createDefaultCommunicationModuleAlarmFlags() {
  return defineAlarmFlags({
    localUserAccessDenied: 0b0000_0000_0000_0001,
    cmChipLowTemperature: 0b0000_0000_0000_0010,
    cmChipHighTemperature: 0b0000_0000_0000_0100,
    airTimeLimitation: 0b0000_0000_0000_1000,
    memoryError: 0b0000_0000_0001_0000,
    lowVoltage: 0b0000_0000_0010_0000,
    highVoltage: 0b0000_0000_0100_0000,
  })
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createDefaultSensorAlarmFlags() {
  return defineAlarmFlags({
    sensorCommunicationError: 0b0000_0000_0000_0001,
    sensorNotSupported: 0b0000_0000_0000_0010,
    sensorInternalError: 0b0000_0000_0000_0100,
  })
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createDefaultChannelAlarmFlags() {
  return defineAlarmFlags({
    shortCondition: 0b0000_0000_0000_0001,
    openCondition: 0b0000_0000_0000_0010,
    outOfMinMeasurementRange: 0b0000_0000_0000_0100,
    outOfMaxMeasurementRange: 0b0000_0000_0000_1000,
    outOfMinPhysicalSensorLimit: 0b0000_0000_0001_0000,
    outOfMaxPhysicalSensorLimit: 0b0000_0000_0010_0000,
  })
}

type MergedFlags<TAlarmFlags extends AlarmFlags, TMergeFlags extends AlarmFlags> = {
  [Key in (keyof TAlarmFlags | Exclude<keyof TMergeFlags, keyof TAlarmFlags>)]: Key extends keyof TAlarmFlags
    ? TAlarmFlags[Key]
    : Key extends keyof TMergeFlags
      ? TMergeFlags[Key]
      : never
}

export function defineAlarmFlags<const TAlarmFlags extends AlarmFlags>(flagsConfig: TAlarmFlags): TAlarmFlags
export function defineAlarmFlags<const TAlarmFlags extends AlarmFlags, const TMergeFlags extends AlarmFlags>(
  flagsConfig: TAlarmFlags,
  merge: TMergeFlags,
): MergedFlags<TAlarmFlags, TMergeFlags>
export function defineAlarmFlags<const TAlarmFlags extends AlarmFlags, const TMergeFlags extends AlarmFlags>(
  flagsConfig: TAlarmFlags,
  merge?: TMergeFlags,
): (MergedFlags<TAlarmFlags, TMergeFlags>) | TAlarmFlags {
  return { ...merge ?? {}, ...flagsConfig }
}

type OmitAlarmFlags<TAlarmFlags extends AlarmFlags, TOmitKeys extends keyof TAlarmFlags> = {
  [Key in keyof TAlarmFlags as Key extends TOmitKeys ? never : Key]: TAlarmFlags[Key]
}

export function omitAlarmFlags<const TAlarmFlags extends AlarmFlags, const TOmitKeys extends keyof TAlarmFlags>(
  flagsConfig: TAlarmFlags,
  omitKeys: TOmitKeys[],
): OmitAlarmFlags<TAlarmFlags, TOmitKeys> {
  const result = {} as OmitAlarmFlags<TAlarmFlags, TOmitKeys>

  for (const [flagName, bitField] of Object.entries(flagsConfig)) {
    // add the fields where the key is not in the omit list
    if (!omitKeys.includes(flagName as TOmitKeys)) {
      result[flagName as keyof OmitAlarmFlags<TAlarmFlags, TOmitKeys>] = bitField as any
    }
  }

  return result
}

type PickAlarmFlags<TAlarmFlags extends AlarmFlags, TPickKeys extends keyof TAlarmFlags> = {
  [Key in keyof TAlarmFlags as Key extends TPickKeys ? Key : never]: TAlarmFlags[Key]
}

export function pickAlarmFlags<const TAlarmFlags extends AlarmFlags, const TPickKeys extends keyof TAlarmFlags>(
  flagsConfig: TAlarmFlags,
  pickKeys: TPickKeys[],
): PickAlarmFlags<TAlarmFlags, TPickKeys> {
  const result = {} as PickAlarmFlags<TAlarmFlags, TPickKeys>

  for (const [flagName, bitField] of Object.entries(flagsConfig)) {
    // add the fields where the key is in the pick list
    if (pickKeys.includes(flagName as TPickKeys)) {
      result[flagName as keyof PickAlarmFlags<TAlarmFlags, TPickKeys>] = bitField as any
    }
  }

  return result
}

/**
 * Creates alarm flags object from a bitfield value using the provided flags configuration.
 */
function createAlarmFlagsFromBitfield<TAlarmFlags extends AlarmFlags>(
  bitfield: number,
  flagsConfig: TAlarmFlags,
): Record<keyof TAlarmFlags, boolean> {
  const result = {} as Record<keyof TAlarmFlags, boolean>

  for (const [flagName, bitPosition] of Object.entries(flagsConfig)) {
    result[flagName as keyof TAlarmFlags] = Boolean(bitfield & bitPosition)
  }

  return result
}

/**
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
 * @param config device configuration containing alarm flags
 * @returns Decoded DeviceAlarmMessageUplinkOutput
 */
export function decodeCommunicationModuleAlarmMessage<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(
  data: number[],
  config: TTULIP3DeviceConfig,
): CommunicationModuleAlarmMessageUplinkOutput<TTULIP3DeviceConfig> {
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
        alarmFlags: createAlarmFlagsFromBitfield(alarmType, config.alarmFlags),
      },
    },
  } as CommunicationModuleAlarmMessageUplinkOutput<TTULIP3DeviceConfig>
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
 * @returns Decoded SensorAlarmMessageUplinkOutput
 */
export function decodeSensorAlarmMessage<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(
  data: number[],
  config: TTULIP3DeviceConfig,
): SensorAlarmMessageUplinkOutput<TTULIP3DeviceConfig> {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x13,
    allowedSubTypes: [0x02],
    minLength: 5,
    messageTypeName: 'Sensor alarm',
  })

  // Parse entries directly from payload starting at index 2
  let currentIndex = 2
  const sensorAlarms: Array<SensorAlarmData<TTULIP3DeviceConfig>[number]> = []

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
    const sensorKey = `sensor${sensorId + 1}` as keyof TTULIP3DeviceConfig

    // Validate that this sensor exists in the configuration
    if (!config[sensorKey]) {
      throw new TypeError(`Sensor alarm for ${String(sensorKey)} is not supported by the device profile.`)
    }

    // Combine alarm type bytes (little endian: low byte first, high byte second)
    const alarmType = (alarmTypeHigh << 8) | alarmTypeLow

    const sensorAlarmFlags = (config[sensorKey] as any as TULIP3SensorConfig).alarmFlags

    sensorAlarms.push({
      sensor: sensorKey,
      sensorId,
      alarmFlags: createAlarmFlagsFromBitfield(alarmType, sensorAlarmFlags),
    } as SensorAlarmData<TTULIP3DeviceConfig>[number])

    currentIndex += 3
  }

  return {
    data: {
      messageType,
      messageSubType,
      sensorAlarms: sensorAlarms as SensorAlarmData<TTULIP3DeviceConfig>,
    },
  } as SensorAlarmMessageUplinkOutput<TTULIP3DeviceConfig>
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
 * @returns Decoded ChannelAlarmMessageUplinkOutput
 * @template TTULIP3DeviceConfig - Type-safe sensor configuration
 * @template TAlarmFlags - Type-safe alarm flags configuration
 */
export function decodeChannelAlarmMessage<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(
  data: number[],
  config: TTULIP3DeviceConfig,
): ChannelAlarmMessageUplinkOutput<TTULIP3DeviceConfig> {
  // Validate message header
  const { messageType, messageSubType } = validateMessageHeader(data, {
    expectedMessageType: 0x13,
    allowedSubTypes: [0x03],
    minLength: 5,
    messageTypeName: 'Channel alarm',
  })

  // Parse entries directly from payload starting at index 2
  let currentIndex = 2
  const channelAlarms: Array<ChannelAlarmData<TTULIP3DeviceConfig>[number]> = []

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
    const sensorKey = `sensor${sensorId + 1}` as keyof TTULIP3DeviceConfig
    const channelKey = `channel${channelId + 1}` as keyof NonNullable<TTULIP3DeviceConfig[keyof TTULIP3DeviceConfig]>

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

    const channelAlarmFlags = ((config[sensorKey] as any as TULIP3SensorConfig)![channelKey as keyof TULIP3SensorConfig] as TULIP3ChannelConfig).alarmFlags

    channelAlarms.push({
      sensor: sensorKey,
      sensorId,
      channel: channelKey,
      channelId,
      channelName,
      alarmFlags: createAlarmFlagsFromBitfield(alarmType, channelAlarmFlags),
    } as ChannelAlarmData<TTULIP3DeviceConfig>[number])

    currentIndex += 3
  }

  return {
    data: {
      messageType,
      messageSubType,
      channelAlarms: channelAlarms as ChannelAlarmData<TTULIP3DeviceConfig>,
    },
  } as ChannelAlarmMessageUplinkOutput<TTULIP3DeviceConfig>
}
