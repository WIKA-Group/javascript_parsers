import type { protocolDataTypeLookup } from './lookups'
import type { AnyCustomRegisterLookup } from './registers'

type _Channels = `channel${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`
type _Sensors = `sensor${1 | 2 | 3 | 4}`

export type DeviceSpecificRegisters = Record<string, any> // TODO:

export interface ChannelIdentificationRegisterFlags {
  measurand?: true
  unit?: true
  minMeasureRange?: true
  maxMeasureRange?: true
  minPhysicalLimit?: true
  maxPhysicalLimit?: true
  accuracy?: true
  offset?: true
  gain?: true
  calibrationDate?: true
  // channel name is always present
}

export function defineChannelIdentificationRegisters<const TChannelIdentificationRegisterFlags extends ChannelIdentificationRegisterFlags>(flags: TChannelIdentificationRegisterFlags): TChannelIdentificationRegisterFlags {
  return flags
}

export interface ChannelConfigurationRegisterFlags {
  protocolDataType?: true
  processAlarmEnabled?: true
  processAlarmDeadBand?: true
  lowThresholdAlarmValue?: true
  highThresholdAlarmValue?: true
  fallingSlopeAlarmValue?: true
  risingSlopeAlarmValue?: true
  lowThresholdWithDelayAlarmValue?: true
  lowThresholdWithDelayAlarmDelay?: true
  highThresholdWithDelayAlarmValue?: true
  highThresholdWithDelayAlarmDelay?: true
  // channel name is always present
}

export function defineChannelConfigurationRegisters<const TChannelConfigurationRegisterFlags extends ChannelConfigurationRegisterFlags>(flags: TChannelConfigurationRegisterFlags): TChannelConfigurationRegisterFlags {
  return flags
}

export interface ChannelRegisterConfig {
  tulip3IdentificationRegisters: ChannelIdentificationRegisterFlags
  tulip3ConfigurationRegisters: ChannelConfigurationRegisterFlags
  channelSpecificIdentificationRegisters: AnyCustomRegisterLookup
  channelSpecificConfigurationRegisters: AnyCustomRegisterLookup
}

export interface TULIP3ChannelConfig {
  /**
   * Measurement limit, not physical limit
   */
  start: number
  /**
   * Measurement limit, not physical limit
   */
  end: number
  measurementTypes: typeof protocolDataTypeLookup[keyof typeof protocolDataTypeLookup][]
  channelName: string
  adjustMeasurementRangeDisallowed?: boolean
  alarmFlags: AlarmFlags
  registerConfig: ChannelRegisterConfig
}

export interface SensorIdentificationRegisterFlags {
  sensorType?: true
  existingChannels?: true
  firmwareVersion?: true
  hardwareVersion?: true
  productionDate?: true
  serialNumberPart1?: true
  serialNumberPart2?: true
}

export function defineSensorIdentificationRegisters<const TSensorIdentificationRegisterFlags extends SensorIdentificationRegisterFlags>(flags: TSensorIdentificationRegisterFlags): TSensorIdentificationRegisterFlags {
  return flags
}

export interface SensorConfigurationRegisterFlags {
  samplingChannels?: true
  bootTime?: true
  communicationTimeout?: true
  communicationRetryCount?: true
}

export function defineSensorConfigurationRegisters<const TSensorConfigurationRegisterFlags extends SensorConfigurationRegisterFlags>(flags: TSensorConfigurationRegisterFlags): TSensorConfigurationRegisterFlags {
  return flags
}

export interface SensorRegisterConfig {
  tulip3IdentificationRegisters: SensorIdentificationRegisterFlags
  tulip3ConfigurationRegisters: SensorConfigurationRegisterFlags
  sensorSpecificIdentificationRegisters: AnyCustomRegisterLookup
  sensorSpecificConfigurationRegisters: AnyCustomRegisterLookup
}

export interface TULIP3SensorConfig {
  channel1?: TULIP3ChannelConfig
  channel2?: TULIP3ChannelConfig
  channel3?: TULIP3ChannelConfig
  channel4?: TULIP3ChannelConfig
  channel5?: TULIP3ChannelConfig
  channel6?: TULIP3ChannelConfig
  channel7?: TULIP3ChannelConfig
  channel8?: TULIP3ChannelConfig
  alarmFlags: AlarmFlags
  registerConfig: SensorRegisterConfig
}

export interface CommunicationModuleIdentificationRegisterFlags {
  productId?: true
  productSubId?: true
  channelPlan?: true
  connectedSensors?: true
  firmwareVersion?: true
  hardwareVersion?: true
  productionDate?: true
  serialNumberPart1?: true
  serialNumberPart2?: true
}

export function defineCommunicationModuleIdentificationRegisters<const TCommunicationModuleIdentificationRegisterFlags extends CommunicationModuleIdentificationRegisterFlags>(flags: TCommunicationModuleIdentificationRegisterFlags): TCommunicationModuleIdentificationRegisterFlags {
  return flags
}

export interface CommunicationModuleConfigurationRegisterFlags {
  measuringPeriodAlarmOff?: true
  measuringPeriodAlarmOn?: true
  transmissionRateAlarmOff?: true
  transmissionRateAlarmOn?: true
  overVoltageThreshold?: true
  underVoltageThreshold?: true
  overTemperatureCmChip?: true
  underTemperatureCmChip?: true
  downlinkAnswerTimeout?: true
  fetchAdditionalDownlinkTimeInterval?: true
  enableBleAdvertising?: true
}

export function defineCommunicationModuleConfigurationRegisters<const TCommunicationModuleConfigurationRegisterFlags extends CommunicationModuleConfigurationRegisterFlags>(flags: TCommunicationModuleConfigurationRegisterFlags): TCommunicationModuleConfigurationRegisterFlags {
  return flags
}

export interface CommunicationModuleRegisterConfig {
  tulip3IdentificationRegisters: CommunicationModuleIdentificationRegisterFlags
  tulip3ConfigurationRegisters: CommunicationModuleConfigurationRegisterFlags
}

export interface TULIP3DeviceConfig {
  sensor1?: TULIP3SensorConfig
  sensor2?: TULIP3SensorConfig
  sensor3?: TULIP3SensorConfig
  sensor4?: TULIP3SensorConfig
  alarmFlags: AlarmFlags
  registerConfig: CommunicationModuleRegisterConfig
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

export type AlarmFlags = Record<string, number>

export interface TULIP3DeviceProfile<TTULIP3DeviceConfig extends TULIP3DeviceConfig = TULIP3DeviceConfig> {

  deviceName: string

  /**
   * Number of decimal places for rounding.
   * Will floor the value to the specified number of decimal places.
   * If provided value is less than 0, it will default to 4.
   * @default 4
   */
  roundingDecimals?: number

  sensorChannelConfig: TTULIP3DeviceConfig
}

export function defineTULIP3DeviceProfile<const TTULIP3DeviceProfile extends TULIP3DeviceProfile>(profile: TTULIP3DeviceProfile): TTULIP3DeviceProfile {
  return profile
}
