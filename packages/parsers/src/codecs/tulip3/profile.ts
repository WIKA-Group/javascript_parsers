import type { protocolDataTypeLookup } from './lookups'

export interface TULIP3ChannelConfig {
  /**
   * Measurement limit, not physical limit
   */
  min: number
  /**
   * Measurement limit, not physical limit
   */
  max: number
  measurementTypes: typeof protocolDataTypeLookup[keyof typeof protocolDataTypeLookup][]
  channelName: string
}

export interface TULIP3SensorChannelConfig {
  channel1?: TULIP3ChannelConfig
  channel2?: TULIP3ChannelConfig
  channel3?: TULIP3ChannelConfig
  channel4?: TULIP3ChannelConfig
  channel5?: TULIP3ChannelConfig
  channel6?: TULIP3ChannelConfig
  channel7?: TULIP3ChannelConfig
  channel8?: TULIP3ChannelConfig
}

export interface TULIP3DeviceSensorConfig {
  sensor1?: TULIP3SensorChannelConfig
  sensor2?: TULIP3SensorChannelConfig
  sensor3?: TULIP3SensorChannelConfig
  sensor4?: TULIP3SensorChannelConfig
}

export interface FullTULIP3DeviceSensorConfig {
  sensor1: NonNullable<TULIP3SensorChannelConfig>
  sensor2: NonNullable<TULIP3SensorChannelConfig>
  sensor3: NonNullable<TULIP3SensorChannelConfig>
  sensor4: NonNullable<TULIP3SensorChannelConfig>
}

/**
 * The key, value pair for flag names and the bits that the value needs to be xor'd against.
 * @example
 * const flags: DeviceAlarmFlags = {
 *   highVoltage: 0b0100_0000,
 *   lowVoltage: 0b0010_0000,
 *   memoryError: 0b0001_0000,
 *   airTimeLimitation: 0b0000_1000,
 *   chipHighTemperature: 0b0000_0100,
 *   chipLowTemperature: 0b0000_0010,
 *   localUserAccessDenied: 0b0000_0001,
 * }
 */

export type DeviceAlarmFlags = Record<string, number>

export interface TULIP3DeviceProfile<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig = TULIP3DeviceSensorConfig> {

  deviceName: string

  /**
   * Number of decimal places for rounding.
   * Will floor the value to the specified number of decimal places.
   * If provided value is less than 0, it will default to 4.
   * @default 4
   */
  roundingDecimals?: number

  sensorChannelConfig: TTULIP3DeviceSensorConfig

  /**
   * Flags for device alarms.
   * These flags indicate the status of various alarms in the device.
   */
  deviceAlarmConfig: {
    /**
     * Flags for communication module alarms.
     */
    communicationModuleAlarms: DeviceAlarmFlags
    /**
     * Flags for sensor alarms.
     */
    sensorAlarms: DeviceAlarmFlags
    /**
     * Flags for sensor channel alarms.
     */
    sensorChannelAlarms: DeviceAlarmFlags
  }

  /**
   * How many bytes a register can have in the identification message.
   * Minimum value is 1, maximum value is 31.
   * @default 31
   */
  identificationMessageMaxRegisterSize?: number

  /**
   * How many bytes a register can have in the configuration message.
   * Minimum value is 1, maximum value is 31.
   * @default 31
   */
  configurationMessageMaxRegisterSize?: number
}

export function defineTULIP3DeviceProfile<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig>(profile: TULIP3DeviceProfile<TTULIP3DeviceSensorConfig>): TULIP3DeviceProfile<TTULIP3DeviceSensorConfig> {
  return profile
}
