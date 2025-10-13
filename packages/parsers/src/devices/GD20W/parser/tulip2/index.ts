import type { Handler, TULIP2Channel } from '../../../../codecs/tulip2'
import type {
  GD20WTULIP2ChannelConfigurationData,
  GD20WTULIP2ConfigurationStatusUplinkOutput,
  GD20WTULIP2DataMessageUplinkOutput,
  GD20WTULIP2DeviceAlarmsUplinkOutput,
  GD20WTULIP2DeviceIdentificationUplinkOutput,
  GD20WTULIP2DeviceStatisticsUplinkOutput,
  GD20WTULIP2ExtendedDeviceIdentificationUplinkOutput,
  GD20WTULIP2MainConfigurationData,
  GD20WTULIP2ProcessAlarmsUplinkOutput,
  GD20WTULIP2SensorTechnicalAlarmsUplinkOutput,
} from '../../schema/tulip2'
import { GD20W_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { createGD20WTULIP2Channels } from './channels'
import {
  ALARM_EVENTS,
  CONFIGURATION_STATUS_BY_ID,
  DEVICE_ALARM_VALID_BITS,
  DEVICE_ALARMS_BY_ID,
  MEASURANDS_BY_ID,
  PROCESS_ALARM_TYPES,
  SENSOR_TECHNICAL_ALARM_VALID_BITS,
  SENSOR_TECHNICAL_ALARMS_BY_ID,
  UNITS_BY_ID,
} from './lookups'

const ERROR_VALUE = 0xFFFF
const GD20W_ROUNDING_DECIMALS = 3

type GD20WTULIP2Channels = ReturnType<typeof createGD20WTULIP2Channels>

type ProcessAlarmType = keyof typeof PROCESS_ALARM_TYPES

type SensorTechnicalAlarmId = keyof typeof SENSOR_TECHNICAL_ALARMS_BY_ID

type DeviceAlarmId = keyof typeof DEVICE_ALARMS_BY_ID

const handleDataMessage: Handler<GD20WTULIP2Channels, GD20WTULIP2DataMessageUplinkOutput> = (input, options) => {
  const minLengthForData = 5
  if (input.bytes.length < minLengthForData) {
    throw new Error(`Data message must contain at least ${minLengthForData} bytes`)
  }

  const hasInvalidLength = (input.bytes.length - 2) % 3 !== 0

  const messageType = input.bytes[0]! as 0x01 | 0x02
  const configurationId = input.bytes[1]!

  const channelChunks: Array<[number, number, number]> = []
  for (let i = 2; i + 2 < input.bytes.length; i += 3) {
    channelChunks.push([
      input.bytes[i]!,
      input.bytes[i + 1]!,
      input.bytes[i + 2]!,
    ])
  }

  const measurements = channelChunks.map(([channelId, high, low]) => {
    const channel = getChannelById(options.channels, channelId)
    const rawValue = (high << 8) | low
    const value = rawValue === ERROR_VALUE
      ? ERROR_VALUE
      : roundValue(TULIPValueToValue(rawValue, channel), options.roundingDecimals)

    return {
      channelId: channel.channelId,
      channelName: channel.name,
      value,
    }
  })

  const result: GD20WTULIP2DataMessageUplinkOutput = {
    data: {
      messageType,
      configurationId,
      measurements: {
        channels: measurements as any,
      },
    },
  }

  if (hasInvalidLength) {
    result.warnings = result.warnings ?? []
    result.warnings.push(`Data message contains an invalid number of bytes. Bytes must have a length of 2 + 3n (n = 1, 2, 3,...). Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`)
  }

  return result
}

const handleProcessAlarmMessage: Handler<GD20WTULIP2Channels, GD20WTULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  const minLengthBytes = 6
  if (input.bytes.length < minLengthBytes) {
    throw new Error(`Process alarm message must contain at least ${minLengthBytes} bytes. Contains ${input.bytes.length} bytes.`)
  }
  if ((input.bytes.length - 2) % 4 !== 0) {
    throw new Error(`Process alarm message must contain 4n + 6 bytes, contains ${input.bytes.length}.`)
  }

  const configurationId = input.bytes[1]!

  const processAlarms = [] as GD20WTULIP2ProcessAlarmsUplinkOutput['data']['processAlarms']

  for (let index = 2; index < input.bytes.length; index += 4) {
    const channelId = input.bytes[index]!
    const channel = getChannelById(options.channels, channelId)

    const alarmTypeByte = input.bytes[index + 1]!
    const { sense, alarmType } = getProcessAlarmType(alarmTypeByte)

    const valueHigh = input.bytes[index + 2]!
    const valueLow = input.bytes[index + 3]!
    const rawValue = (valueHigh << 8) | valueLow
    const isSlopeAlarm = alarmType === PROCESS_ALARM_TYPES['falling slope'] || alarmType === PROCESS_ALARM_TYPES['rising slope']
    const value = isSlopeAlarm
      ? roundValue(slopeValueToValue(rawValue, channel), options.roundingDecimals)
      : roundValue(TULIPValueToValue(rawValue, channel), options.roundingDecimals)

    processAlarms.push({
      channelName: channel.name as any,
      channelId: channel.channelId as any,
      alarmType: alarmType as any,
      alarmTypeName: getProcessAlarmTypeName(alarmType),
      event: sense,
      eventName: getProcessAlarmEventName(sense),
      value,
    })
  }

  return {
    data: {
      messageType: 0x03,
      configurationId,
      processAlarms,
    },
  }
}

const handleSensorTechnicalAlarmMessage: Handler<GD20WTULIP2Channels, GD20WTULIP2SensorTechnicalAlarmsUplinkOutput> = (input, options) => {
  const maxLengthBytes = 5
  const warnings: string[] = []

  if (input.bytes.length > maxLengthBytes) {
    warnings.push(`Sensor technical alarm message contains more than ${maxLengthBytes} bytes. Data might have been decoded incorrectly. Contains ${input.bytes.length} bytes.`)
  }

  const configurationId = input.bytes[1]!
  const channelId = input.bytes[2]!
  const channel = getChannelById(options.channels, channelId)
  const alarmBitMap = (input.bytes[3]! << 8) | input.bytes[4]!

  const alarms: SensorTechnicalAlarmId[] = []
  const invalidBits: number[] = []

  for (let bit = 0; bit < 16; bit++) {
    if ((alarmBitMap & (1 << bit)) !== 0) {
      if (SENSOR_TECHNICAL_ALARM_VALID_BITS.includes(bit as SensorTechnicalAlarmId)) {
        alarms.push(bit as SensorTechnicalAlarmId)
      }
      else {
        invalidBits.push(bit)
      }
    }
  }

  if (invalidBits.length > 0) {
    warnings.push(`Sensor technical alarm message contains invalid alarm bits: ${invalidBits.join(', ')}. Only bits ${SENSOR_TECHNICAL_ALARM_VALID_BITS.join(', ')} are valid.`)
  }

  const result: GD20WTULIP2SensorTechnicalAlarmsUplinkOutput = {
    data: {
      messageType: 0x04,
      configurationId,
      sensorTechnicalAlarms: alarms.map(alarm => ({
        channelName: channel.name as any,
        channelId: channelId as any,
        alarmType: alarm,
        alarmDescription: SENSOR_TECHNICAL_ALARMS_BY_ID[alarm],
      } satisfies GD20WTULIP2SensorTechnicalAlarmsUplinkOutput['data']['sensorTechnicalAlarms'][number])),
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleDeviceAlarmMessage: Handler<GD20WTULIP2Channels, GD20WTULIP2DeviceAlarmsUplinkOutput> = (input) => {
  const requiredLength = 4
  if (input.bytes.length < requiredLength) {
    throw new Error(`Device alarm message must contain ${requiredLength} bytes. Contains ${input.bytes.length} bytes.`)
  }

  const warnings: string[] = []
  if (input.bytes.length > requiredLength) {
    warnings.push(`Device alarm message contains more than ${requiredLength} bytes. Data might have been decoded incorrectly. Contains ${input.bytes.length} bytes.`)
  }

  const configurationId = input.bytes[1]!
  const alarmBitMap = (input.bytes[2]! << 8) | input.bytes[3]!

  const alarms: DeviceAlarmId[] = []
  const invalidBits: number[] = []

  for (let bit = 0; bit < 16; bit++) {
    if ((alarmBitMap & (1 << bit)) !== 0) {
      if (DEVICE_ALARM_VALID_BITS.includes(bit as DeviceAlarmId)) {
        alarms.push(bit as DeviceAlarmId)
      }
      else {
        invalidBits.push(bit)
      }
    }
  }

  if (invalidBits.length > 0) {
    warnings.push(`Sensor technical alarm message contains invalid alarm bits: ${invalidBits.join(', ')}. Only bits ${DEVICE_ALARM_VALID_BITS.join(', ')} are valid.`)
  }

  const result: GD20WTULIP2DeviceAlarmsUplinkOutput = {
    data: {
      messageType: 0x05,
      configurationId,
      deviceAlarms: alarms.map(alarm => ({
        alarmType: alarm,
        alarmDescription: DEVICE_ALARMS_BY_ID[alarm],
      })),
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleConfigurationStatusMessage: Handler<GD20WTULIP2Channels, GD20WTULIP2ConfigurationStatusUplinkOutput> = (input) => {
  const configurationId = input.bytes[1]!
  const status = input.bytes[2]! >> 4

  if (!(status in CONFIGURATION_STATUS_BY_ID)) {
    throw new Error(`Configuration status message contains an invalid status: ${status}`)
  }

  const commandType = input.bytes[3]!
  if (commandType !== 0x04 && commandType < 0x40) {
    throw new Error(`Configuration status message contains an invalid command type: ${commandType}`)
  }

  const warnings: string[] = []

  if (commandType === 0x04) {
    const mainConfigLength = 17
    if (input.bytes.length < mainConfigLength) {
      throw new Error(`Configuration status message contains an invalid length for main configuration: ${input.bytes.length}`)
    }
    if (input.bytes.length > mainConfigLength) {
      warnings.push(`Configuration status message for main configuration contains more than ${mainConfigLength} bytes. Data might have been decoded incorrectly. Contains ${input.bytes.length} bytes.`)
    }
  }
  else {
    const channelConfigLength = 8
    const channelConfigMaxLength = 16
    if (input.bytes.length < channelConfigLength) {
      throw new Error(`Configuration status message contains an invalid length for channel configuration: ${input.bytes.length}`)
    }
    if (input.bytes.length > channelConfigMaxLength) {
      warnings.push(`Configuration status message for channel configuration contains more than ${channelConfigMaxLength} bytes. Data might have been decoded incorrectly. Contains ${input.bytes.length} bytes.`)
    }
  }

  const statusDescription = CONFIGURATION_STATUS_BY_ID[status as keyof typeof CONFIGURATION_STATUS_BY_ID]

  const resultData = commandType === 0x04
    ? {
        commandType: 0x04 as const,
        mainConfiguration: parseMainConfigurationData(input, warnings),
      }
    : {
        commandType,
        channelConfiguration: parseChannelConfigurationData(input, warnings),
      }

  const result: GD20WTULIP2ConfigurationStatusUplinkOutput = {
    data: {
      messageType: 0x06,
      configurationId,
      configurationStatus: {
        status,
        statusDescription,
        ...resultData,
      },
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleDeviceIdentificationMessage: Handler<GD20WTULIP2Channels, GD20WTULIP2DeviceIdentificationUplinkOutput> = (input) => {
  const minLength = 39

  const warnings: string[] = []

  if (input.bytes.length < minLength) {
    throw new Error(`Device identification message must contain at least ${minLength} bytes. Contains ${input.bytes.length} bytes.`)
  }

  if (input.bytes.length > minLength) {
    warnings.push(`Device identification message contains more than ${minLength} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`)
  }

  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!
  if (productId !== 0x15) {
    throw new Error(`Device identification message contains an invalid product ID: ${productId}, expected 0x15 (21).`)
  }
  const productSubId = input.bytes[3]!
  if (productSubId !== 0x40) {
    throw new Error(`Device identification message contains an invalid product sub ID: ${productSubId}, expected 0x00 (0).`)
  }

  const wirelessModuleFirmwareVersion = `${input.bytes[4]! >> 4}.${input.bytes[4]! & 0x0F}.${input.bytes[5]!}`
  const wirelessModuleHardwareVersion = `${input.bytes[6]! >> 4}.${input.bytes[6]! & 0x0F}.${input.bytes[7]!}`

  const semverWarnings = checkSemVerVersions([
    wirelessModuleFirmwareVersion,
    wirelessModuleHardwareVersion,
  ])
  if (semverWarnings) {
    warnings.push(...semverWarnings)
  }

  const serialNumber = String.fromCharCode(...input.bytes.slice(8, 18))

  const channels = {
    channel0: {
      measurand: lookupValue(MEASURANDS_BY_ID, input.bytes[19]!, 'Device identification message contains an invalid measurand for channel 0'),
      unit: lookupValue(UNITS_BY_ID, input.bytes[20]!, 'Device identification message contains an invalid unit for channel 0'),
    },
    channel1: {
      measurand: lookupValue(MEASURANDS_BY_ID, input.bytes[21]!, 'Device identification message contains an invalid measurand for channel 1'),
      unit: lookupValue(UNITS_BY_ID, input.bytes[22]!, 'Device identification message contains an invalid unit for channel 1'),
    },
    channel2: {
      measurand: lookupValue(MEASURANDS_BY_ID, input.bytes[23]!, 'Device identification message contains an invalid measurand for channel 2'),
      unit: lookupValue(UNITS_BY_ID, input.bytes[24]!, 'Device identification message contains an invalid unit for channel 2'),
    },
    channel3: {
      measurand: lookupValue(MEASURANDS_BY_ID, input.bytes[25]!, 'Device identification message contains an invalid measurand for channel 3'),
      unit: lookupValue(UNITS_BY_ID, input.bytes[26]!, 'Device identification message contains an invalid unit for channel 3'),
    },
    channel4: {
      measurand: lookupValue(MEASURANDS_BY_ID, input.bytes[27]!, 'Device identification message contains an invalid measurand for channel 4'),
      unit: lookupValue(UNITS_BY_ID, input.bytes[28]!, 'Device identification message contains an invalid unit for channel 4'),
    },
    channel5: {
      measurand: lookupValue(MEASURANDS_BY_ID, input.bytes[29]!, 'Device identification message contains an invalid measurand for channel 5'),
      unit: lookupValue(UNITS_BY_ID, input.bytes[30]!, 'Device identification message contains an invalid unit for channel 5'),
    },
  }

  const gasMixtures = {
    SF6: input.bytes[31]!,
    N2: input.bytes[32]!,
    CF4: input.bytes[33]!,
    O2: input.bytes[34]!,
    C02: input.bytes[35]!,
    Novec4710: input.bytes[36]!,
    He: input.bytes[37]!,
    Ar: input.bytes[38]!,
  }

  const result: GD20WTULIP2DeviceIdentificationUplinkOutput = {
    data: {
      messageType: 0x07,
      configurationId,
      deviceIdentification: {
        productId: 0x15,
        productSubId: 0x40,
        wirelessModuleFirmwareVersion,
        wirelessModuleHardwareVersion,
        serialNumber,
        channels,
        gasMixtures,
      },
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleDeviceStatisticsMessage: Handler<GD20WTULIP2Channels, GD20WTULIP2DeviceStatisticsUplinkOutput> = (input) => {
  const minLength = 3
  if (input.bytes.length < minLength) {
    throw new Error(`Keep alive message must contain at least ${minLength} bytes. Contains ${input.bytes.length} bytes.`)
  }

  const warnings: string[] = []
  if (input.bytes.length > minLength) {
    warnings.push(`Keep alive message contains more than ${minLength} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`)
  }

  const configurationId = input.bytes[1]!
  const indicatorByte = input.bytes[2]!

  const result: GD20WTULIP2DeviceStatisticsUplinkOutput = {
    data: {
      messageType: 0x08,
      configurationId,
      batteryLevelIndicator: {
        restartedSinceLastKeepAlive: (indicatorByte & 0b1000_0000) === 0x80,
        batteryLevelPercent: indicatorByte & 0b0111_1111,
        batteryLevelCalculationError: (indicatorByte & 0b0111_1111) === 0x7F,
        batteryPresent: (indicatorByte & 0b1111_1111) !== 0,
      },
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleExtendedDeviceIdentificationMessage: Handler<GD20WTULIP2Channels, GD20WTULIP2ExtendedDeviceIdentificationUplinkOutput> = (input) => {
  const minLength = 50

  const warnings: string[] = []

  if (input.bytes.length < minLength) {
    throw new Error(`Extended device identification message must contain at least ${minLength} bytes. Contains ${input.bytes.length} bytes.`)
  }

  if (input.bytes.length > minLength) {
    warnings.push(`Extended device identification message contains more than ${minLength} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`)
  }

  const configurationId = input.bytes[1]!

  const ranges = {
    channel0: {
      min: readFloat32(input.bytes, 2),
      max: readFloat32(input.bytes, 6),
    },
    channel1: {
      min: readFloat32(input.bytes, 10),
      max: readFloat32(input.bytes, 14),
    },
    channel2: {
      min: readFloat32(input.bytes, 18),
      max: readFloat32(input.bytes, 22),
    },
    channel3: {
      min: readFloat32(input.bytes, 26),
      max: readFloat32(input.bytes, 30),
    },
    channel4: {
      min: readFloat32(input.bytes, 34),
      max: readFloat32(input.bytes, 38),
    },
    channel5: {
      min: readFloat32(input.bytes, 42),
      max: readFloat32(input.bytes, 46),
    },
  } as const

  const result: GD20WTULIP2ExtendedDeviceIdentificationUplinkOutput = {
    data: {
      messageType: 0x09,
      configurationId,
      channelRanges: ranges,
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2GD20WCodec() {
  return defineTULIP2Codec({
    deviceName: GD20W_NAME,
    roundingDecimals: GD20W_ROUNDING_DECIMALS,
    channels: createGD20WTULIP2Channels(),
    handlers: {
      0x01: handleDataMessage,
      0x02: handleDataMessage,
      0x03: handleProcessAlarmMessage,
      0x04: handleSensorTechnicalAlarmMessage,
      0x05: handleDeviceAlarmMessage,
      0x06: handleConfigurationStatusMessage,
      0x07: handleDeviceIdentificationMessage,
      0x08: handleDeviceStatisticsMessage,
      0x09: handleExtendedDeviceIdentificationMessage,
    },
  })
}

function getChannelById(channels: ReadonlyArray<TULIP2Channel>, id: number): TULIP2Channel {
  const channel = channels.find(c => c.channelId === id)
  if (!channel) {
    throw new Error(`Unknown channel id ${id}`)
  }
  return channel
}

function getProcessAlarmType(byte: number): { sense: 0 | 1, alarmType: number } {
  const sense = ((byte & 0b1000_0000) >> 7) as 0 | 1
  const alarmType = (byte & 0b0000_0111) as (typeof PROCESS_ALARM_TYPES)[ProcessAlarmType]

  if (!Number.isInteger(alarmType) || alarmType < 0 || alarmType > 5) {
    throw new Error(`Invalid alarmType in process alarm: ${alarmType}`)
  }

  return { sense, alarmType }
}

function getProcessAlarmTypeName(alarmType: number): ProcessAlarmType {
  const entry = Object.entries(PROCESS_ALARM_TYPES).find(([, value]) => value === alarmType)
  if (!entry) {
    throw new Error(`Unknown process alarm type ${alarmType}`)
  }
  return entry[0] as ProcessAlarmType
}

function getProcessAlarmEventName(event: number): keyof typeof ALARM_EVENTS {
  const entry = Object.entries(ALARM_EVENTS).find(([, value]) => value === event)
  if (!entry) {
    throw new Error(`Unknown process alarm event ${event}`)
  }
  return entry[0] as keyof typeof ALARM_EVENTS
}

function parseMainConfigurationData(input: { bytes: number[] }, warnings: string[]): GD20WTULIP2MainConfigurationData {
  const acquisitionTimeAlarmsOffValue = (input.bytes[4]! << 24) | (input.bytes[5]! << 16) | (input.bytes[6]! << 8) | input.bytes[7]!
  const publicationTimeFactorAlarmsOffValue = (input.bytes[8]! << 8) | input.bytes[9]!
  const acquisitionTimeAlarmsOnValue = (input.bytes[10]! << 24) | (input.bytes[11]! << 16) | (input.bytes[12]! << 8) | input.bytes[13]!
  const publicationTimeFactorAlarmsOnValue = (input.bytes[14]! << 8) | input.bytes[15]!

  if (acquisitionTimeAlarmsOffValue !== 0 && acquisitionTimeAlarmsOffValue % publicationTimeFactorAlarmsOffValue !== 0) {
    warnings.push('Acquisition time alarms off must be a multiple of publication time factor alarms off')
  }
  if (acquisitionTimeAlarmsOnValue !== 0 && acquisitionTimeAlarmsOnValue % publicationTimeFactorAlarmsOnValue !== 0) {
    warnings.push('Acquisition time alarms on must be a multiple of publication time factor alarms on')
  }

  return {
    acquisitionTimeAlarmsOff: acquisitionTimeAlarmsOffValue === 0 ? 'unauthorized' : acquisitionTimeAlarmsOffValue,
    publicationTimeFactorAlarmsOff: publicationTimeFactorAlarmsOffValue === 0 ? 'unauthorized' : publicationTimeFactorAlarmsOffValue,
    acquisitionTimeAlarmsOn: acquisitionTimeAlarmsOnValue === 0 ? 'unauthorized' : acquisitionTimeAlarmsOnValue,
    publicationTimeFactorAlarmsOn: publicationTimeFactorAlarmsOnValue === 0 ? 'unauthorized' : publicationTimeFactorAlarmsOnValue,
  }
}

function parseChannelConfigurationData(input: { bytes: number[] }, warnings: string[]): GD20WTULIP2ChannelConfigurationData {
  const sensorOrChannelId = input.bytes[4]!
  if (![0, 1, 2, 3, 4, 5].includes(sensorOrChannelId)) {
    warnings.push('Invalid sensor or channel id')
  }

  const deadBand = (input.bytes[5]! << 8) | input.bytes[6]!
  const alarmBitMap = input.bytes[7]!

  if (alarmBitMap & 0b0000_0011) {
    warnings.push('Reserved alarm flags 0 and/or 1 are set')
  }

  const alarms = {
    isAlarm1Enabled: !!(alarmBitMap & 0b1000_0000),
    isAlarm2Enabled: !!(alarmBitMap & 0b0100_0000),
    isAlarm3Enabled: !!(alarmBitMap & 0b0010_0000),
    isAlarm4Enabled: !!(alarmBitMap & 0b0001_0000),
    isAlarm5Enabled: !!(alarmBitMap & 0b0000_1000),
    isAlarm6Enabled: !!(alarmBitMap & 0b0000_0100),
  }

  const alarmValues: number[] = []
  for (let i = 8; i < input.bytes.length; i += 2) {
    alarmValues.push((input.bytes[i]! << 8) | input.bytes[i + 1]!)
  }

  let alarmIndex = 0

  const channelConfiguration: GD20WTULIP2ChannelConfigurationData = {
    sensorOrChannelId,
    deadBand,
  }

  if (alarms.isAlarm1Enabled) {
    channelConfiguration.alarm1Threshold = alarmValues[alarmIndex++]
  }
  if (alarms.isAlarm2Enabled) {
    channelConfiguration.alarm2Threshold = alarmValues[alarmIndex++]
  }
  if (alarms.isAlarm3Enabled) {
    channelConfiguration.alarm3Slope = alarmValues[alarmIndex++]
  }
  if (alarms.isAlarm4Enabled) {
    channelConfiguration.alarm4Slope = alarmValues[alarmIndex++]
  }
  if (alarms.isAlarm5Enabled) {
    channelConfiguration.alarm5Threshold = alarmValues[alarmIndex++]
    channelConfiguration.alarm5Period = alarmValues[alarmIndex++]
  }
  if (alarms.isAlarm6Enabled) {
    channelConfiguration.alarm6Threshold = alarmValues[alarmIndex++]
    channelConfiguration.alarm6Period = alarmValues[alarmIndex++]
  }

  return channelConfiguration
}

function lookupValue<T extends Record<number, string>>(dictionary: T, key: number, errorMessage: string): T[keyof T] {
  const value = dictionary[key as keyof T]
  if (!value) {
    throw new Error(errorMessage)
  }
  return value
}

function checkSemVerVersions(semVers: string[]): string[] | null {
  const warnings: string[] = []

  for (const semVer of semVers) {
    const parts = semVer.split('.')
    if (parts.length !== 3) {
      throw new Error(`Invalid semantic version format: ${semVer}`)
    }

    const [majorStr, minorStr, patchStr] = parts
    const major = Number.parseInt(majorStr!)
    const minor = Number.parseInt(minorStr!)
    const patch = Number.parseInt(patchStr!)

    if (major.toString() !== majorStr || minor.toString() !== minorStr || patch.toString() !== patchStr) {
      throw new Error(`Semantic version contains non-integer value: ${semVer}`)
    }

    if (major < 0 || major > 16) {
      warnings.push(`Major version ${major} is out of range for semver ${semVer}`)
    }
    if (minor < 0 || minor > 16) {
      warnings.push(`Minor version ${minor} is out of range for semver ${semVer}`)
    }
    if (patch < 0 || patch > 255) {
      warnings.push(`Patch version ${patch} is out of range for semver ${semVer}`)
    }
  }

  return warnings.length > 0 ? warnings : null
}

function readFloat32(bytes: number[], start: number): number {
  return intTuple4ToFloat32WithThreshold([
    bytes[start]!,
    bytes[start + 1]!,
    bytes[start + 2]!,
    bytes[start + 3]!,
  ])
}
