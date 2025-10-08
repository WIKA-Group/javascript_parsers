import type { Handler } from '../../../../codecs/tulip2'
import type {
  PGUTULIP2DataMessageData,
  PGUTULIP2DataMessageUplinkOutput,
  PGUTULIP2DeviceAlarmsData,
  PGUTULIP2DeviceAlarmsUplinkOutput,
  PGUTULIP2DeviceInformationData,
  PGUTULIP2DeviceInformationUplinkOutput,
  PGUTULIP2DeviceStatisticsData,
  PGUTULIP2DeviceStatisticsUplinkOutput,
  PGUTULIP2ExtendedDeviceInformationData,
  PGUTULIP2ExtendedDeviceInformationUplinkOutput,
  PGUTULIP2ProcessAlarmsData,
  PGUTULIP2ProcessAlarmsUplinkOutput,
  PGUTULIP2TechnicalAlarmsData,
  PGUTULIP2TechnicalAlarmsUplinkOutput,
} from '../../schema/tulip2'
import { PGU_NETRIS3_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue, slopeValueToValue, TULIPValueToValue } from '../../../../utils'
import { createTULIP2PGUChannels, PGUTULIP2_DEVICE_TEMPERATURE_CHANNEL, PGUTULIP2_PRESSURE_CHANNEL } from './channels'
import {
  ALARM_EVENTS,
  DEVICE_ALARM_STATUS_TYPES,
  LPP_MEASURANDS_BY_ID,
  LPP_UNITS_BY_ID,
  PROCESS_ALARM_TYPES,
  PRODUCT_SUB_ID_NAMES,
  TECHNICAL_ALARM_TYPES,
  TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE,
} from './lookups'

const ERROR_VALUE = 0xFFFF

type TULIP2PGUChannels = ReturnType<typeof createTULIP2PGUChannels>
type ProductSubId = (typeof PRODUCT_SUB_ID_NAMES)[keyof typeof PRODUCT_SUB_ID_NAMES]
type ProductSubIdName = keyof typeof PRODUCT_SUB_ID_NAMES
interface ResolvedProductSubId {
  id: ProductSubId
  name: ProductSubIdName
}

type DeviceInformationChannelConfiguration = PGUTULIP2DeviceInformationData['channelConfigurations'][number]
type MeasurandId = DeviceInformationChannelConfiguration['measurand']
type MeasurandName = DeviceInformationChannelConfiguration['measurandName']
type UnitId = DeviceInformationChannelConfiguration['unit']
type UnitName = DeviceInformationChannelConfiguration['unitName']

type TechnicalAlarmTypeId = (typeof TECHNICAL_ALARM_TYPES)[keyof typeof TECHNICAL_ALARM_TYPES]
type TechnicalCauseOfFailureName = (typeof TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE)[keyof typeof TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE][number]['name']

function resolveCauseOfFailureName(alarmType: number, causeOfFailure: number): TechnicalCauseOfFailureName {
  const entries = TECHNICAL_CAUSE_OF_FAILURE_ENTRIES_BY_ALARM_TYPE[alarmType as TechnicalAlarmTypeId]
  if (!entries) {
    throw new Error(`Unknown technical alarm type ${alarmType}`)
  }

  const match = entries.find(entry => (causeOfFailure & entry.mask) !== 0)
  if (!match) {
    throw new Error(`Unknown causeOfFailure ${causeOfFailure} for technical alarm type ${alarmType}`)
  }

  return match.name
}

function findChannel(
  channels: TULIP2PGUChannels,
  channelId: typeof PGUTULIP2_PRESSURE_CHANNEL.channelId,
): Extract<TULIP2PGUChannels[number], { channelId: typeof PGUTULIP2_PRESSURE_CHANNEL.channelId }>
function findChannel(
  channels: TULIP2PGUChannels,
  channelId: typeof PGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.channelId,
): Extract<TULIP2PGUChannels[number], { channelId: typeof PGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.channelId }>
function findChannel(
  channels: TULIP2PGUChannels,
  channelId: number,
): TULIP2PGUChannels[number]
function findChannel(channels: TULIP2PGUChannels, channelId: number): TULIP2PGUChannels[number] {
  const channel = channels.find(candidate => candidate.channelId === channelId)
  if (!channel) {
    throw new Error(`Channel configuration missing for channelId ${channelId}`)
  }
  return channel
}

const handleDataMessage: Handler<TULIP2PGUChannels, PGUTULIP2DataMessageUplinkOutput> = (input, options) => {
  if (input.bytes.length < 4 || input.bytes.length > 11) {
    throw new Error(`Data message 01/02 needs at least 4 and maximum 11 bytes but got ${input.bytes.length}`)
  }

  const messageType = input.bytes[0]! as 1 | 2
  const configurationId = input.bytes[1]!
  const pressureChannel = findChannel(options.channels, PGUTULIP2_PRESSURE_CHANNEL.channelId)
  const temperatureChannel = findChannel(options.channels, PGUTULIP2_DEVICE_TEMPERATURE_CHANNEL.channelId)

  const channels: PGUTULIP2DataMessageData['channels'][number][] = []
  const warnings: string[] = []

  if (input.bytes.length < 5) {
    warnings.push(`Not enough data to decode channel (pressure). Payload must has a length of 2 bytes, input data length: ${input.bytes.length}`)
  }
  else {
    const rawPressure = (input.bytes[3]! << 8) | input.bytes[4]!
    if (rawPressure === ERROR_VALUE) {
      warnings.push('Invalid data for channel - pressure : 0xffff, 65535')
    }
    else {
      channels.push({
        channelId: pressureChannel.channelId,
        channelName: pressureChannel.name,
        value: roundValue(TULIPValueToValue(rawPressure, pressureChannel), options.roundingDecimals),
      })
    }
  }

  if (input.bytes.length < 7) {
    warnings.push(`Not enough data to decode channel (temperature). Payload must has a length of 4 bytes, input data length: ${input.bytes.length}`)
  }
  else {
    const rawTemperature = (input.bytes[5]! << 8) | input.bytes[6]!
    if (rawTemperature === ERROR_VALUE) {
      warnings.push('Invalid data for channel - device temperature : 0xffff, 65535')
    }
    else {
      channels.push({
        channelId: temperatureChannel.channelId,
        channelName: temperatureChannel.name,
        value: roundValue(TULIPValueToValue(rawTemperature, temperatureChannel), options.roundingDecimals),
      })
    }
  }

  const result: PGUTULIP2DataMessageUplinkOutput = {
    data: {
      messageType,
      configurationId,
      measurement: {
        channels,
      },
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleProcessAlarmMessage: Handler<TULIP2PGUChannels, PGUTULIP2ProcessAlarmsUplinkOutput> = (input, options) => {
  if (input.bytes.length < 6 || (input.bytes.length - 3) % 3 !== 0) {
    throw new Error(`Process alarm 03 needs at least 6 bytes and got ${input.bytes.length}. Also all bytes for each alarm needed`)
  }

  const configurationId = input.bytes[1]!
  const processAlarms: PGUTULIP2ProcessAlarmsData = []
  const warnings: string[] = []

  for (let byteIndex = 3; byteIndex < input.bytes.length; byteIndex += 3) {
    const header = input.bytes[byteIndex]!
    const channelId = (header & 0x78) >> 3
    const alarmType = header & 0x07
    const event = (header & 0x80) >> 7
    const rawValue = (input.bytes[byteIndex + 1]! << 8) | input.bytes[byteIndex + 2]!

    const channel = findChannel(options.channels, channelId)

    let value: number
    if (rawValue === ERROR_VALUE) {
      value = ERROR_VALUE
    }
    else if (alarmType === PROCESS_ALARM_TYPES['falling slope'] || alarmType === PROCESS_ALARM_TYPES['rising slope']) {
      value = roundValue(slopeValueToValue(rawValue, channel), options.roundingDecimals)
    }
    else {
      value = roundValue(TULIPValueToValue(rawValue, channel), options.roundingDecimals)
    }

    const alarmTypeName = (Object.entries(PROCESS_ALARM_TYPES).find(([, id]) => id === alarmType)?.[0]) as (keyof typeof PROCESS_ALARM_TYPES) | undefined
    if (!alarmTypeName) {
      throw new Error(`Unknown alarmType ${alarmType} in process alarm message`)
    }

    const eventName = (Object.entries(ALARM_EVENTS).find(([, id]) => id === event)?.[0]) as (keyof typeof ALARM_EVENTS) | undefined
    if (!eventName) {
      throw new Error(`Unknown event ${event} in process alarm message`)
    }

    processAlarms.push({
      channelId,
      channelName: channel.name,
      alarmType,
      alarmTypeName,
      event,
      eventName,
      value,
    } as PGUTULIP2ProcessAlarmsData[number])

    if (value === ERROR_VALUE) {
      warnings.push(`Invalid data for ${String(channel.name)}channel`)
    }
  }

  const result: PGUTULIP2ProcessAlarmsUplinkOutput = {
    data: {
      messageType: 0x03,
      configurationId,
      processAlarms,
    },
  }

  if (warnings.length > 0) {
    result.warnings = warnings
  }

  return result
}

const handleTechnicalAlarmMessage: Handler<TULIP2PGUChannels, PGUTULIP2TechnicalAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length < 6 || (input.bytes.length - 3) % 3 !== 0) {
    throw new Error(`Technical alarm 04 needs 6 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const technicalAlarms: PGUTULIP2TechnicalAlarmsData = []

  for (let byteIndex = 3; byteIndex < input.bytes.length; byteIndex += 3) {
    const alarmType = input.bytes[byteIndex]!
    const alarmTypeNameEntry = Object.entries(TECHNICAL_ALARM_TYPES).find(([, id]) => id === alarmType)
    if (!alarmTypeNameEntry) {
      throw new Error(`Unknown technical alarm type ${alarmType}`)
    }
    const alarmTypeName = alarmTypeNameEntry[0] as keyof typeof TECHNICAL_ALARM_TYPES
    const causeOfFailure = input.bytes[byteIndex + 2]!

    const causeOfFailureName = resolveCauseOfFailureName(alarmType, causeOfFailure)

    technicalAlarms.push({
      alarmType,
      alarmTypeName,
      causeOfFailure,
      causeOfFailureName,
    } as PGUTULIP2TechnicalAlarmsData[number])
  }

  return {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms,
    },
  }
}

const handleDeviceAlarmMessage: Handler<TULIP2PGUChannels, PGUTULIP2DeviceAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length !== 4) {
    throw new Error(`Device alarm 05 needs at least 4 bytes got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const alarmStatus = ((input.bytes[2]! << 8) | input.bytes[3]!) >>> 0
  const alarmStatusNames: PGUTULIP2DeviceAlarmsData['alarmStatusNames'] = []

  for (let bitIndex = 0, nameIndex = 0; bitIndex < 15; bitIndex += 1) {
    const mask = 1 << bitIndex
    if ((alarmStatus & mask) !== 0) {
      const entry = Object.entries(DEVICE_ALARM_STATUS_TYPES).find(([, value]) => value === mask)
      if (entry) {
        alarmStatusNames[nameIndex] = entry[0] as keyof typeof DEVICE_ALARM_STATUS_TYPES
        nameIndex += 1
      }
    }
  }

  return {
    data: {
      messageType: 0x05,
      configurationId,
      deviceAlarm: {
        alarmStatus,
        alarmStatusNames,
      },
    },
  }
}

function resolveProductSubId(productSubId: number): ResolvedProductSubId {
  const entry = Object.entries(PRODUCT_SUB_ID_NAMES).find(([, value]) => value === productSubId)
  if (!entry) {
    throw new Error(`Unknown productSubId ${productSubId} in device identification message`)
  }
  const [name, id] = entry as [ProductSubIdName, ProductSubId]
  return { id, name }
}

function resolveMeasurand(measurand: number): { id: MeasurandId, name: MeasurandName } {
  const name = LPP_MEASURANDS_BY_ID[measurand as keyof typeof LPP_MEASURANDS_BY_ID]
  if (!name) {
    throw new Error(`Unknown measurand ${measurand} in device identification message`)
  }
  return {
    id: measurand as MeasurandId,
    name,
  }
}

function resolveUnit(unit: number): { id: UnitId, name: UnitName } {
  const name = LPP_UNITS_BY_ID[unit as keyof typeof LPP_UNITS_BY_ID]
  if (!name) {
    throw new Error(`Unknown unit ${unit} in device identification message`)
  }
  return {
    id: unit as UnitId,
    name,
  }
}

function toFixedFloat(value: number): number {
  return Number.parseFloat(value.toFixed(6))
}

const handleDeviceIdentificationMessage: Handler<TULIP2PGUChannels, PGUTULIP2DeviceInformationUplinkOutput> = (input) => {
  if (input.bytes.length < 16 || input.bytes.length > 56) {
    throw new Error(`Identification message 07 needs at least 16 and maximum 56 bytes, but got ${input.bytes.length}`)
  }

  const messageType = 0x07
  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!
  const productIdName = productId === 15 ? 'NETRIS3' : productId
  const { id: productSubId, name: productSubIdName } = resolveProductSubId(input.bytes[3]!)
  const sensorDeviceTypeId = (input.bytes[4]! << 8) | input.bytes[5]!

  const channelConfigurations: PGUTULIP2DeviceInformationData['channelConfigurations'] = []

  const pressureMeasurand = resolveMeasurand(input.bytes[6]!)
  const pressureMeasurementRangeStart = toFixedFloat(intTuple4ToFloat32WithThreshold([
    input.bytes[7]!,
    input.bytes[8]!,
    input.bytes[9]!,
    input.bytes[10]!,
  ]))
  const pressureMeasurementRangeEnd = toFixedFloat(intTuple4ToFloat32WithThreshold([
    input.bytes[11]!,
    input.bytes[12]!,
    input.bytes[13]!,
    input.bytes[14]!,
  ]))
  const pressureUnit = resolveUnit(input.bytes[15]!)

  channelConfigurations.push({
    measurand: pressureMeasurand.id,
    measurandName: pressureMeasurand.name,
    measurementRangeStart: pressureMeasurementRangeStart,
    measurementRangeEnd: pressureMeasurementRangeEnd,
    unit: pressureUnit.id,
    unitName: pressureUnit.name,
  })

  if (input.bytes.length >= 26) {
    const temperatureMeasurand = resolveMeasurand(input.bytes[16]!)
    const temperatureMeasurementRangeStart = toFixedFloat(intTuple4ToFloat32WithThreshold([
      input.bytes[17]!,
      input.bytes[18]!,
      input.bytes[19]!,
      input.bytes[20]!,
    ]))
    const temperatureMeasurementRangeEnd = toFixedFloat(intTuple4ToFloat32WithThreshold([
      input.bytes[21]!,
      input.bytes[22]!,
      input.bytes[23]!,
      input.bytes[24]!,
    ]))
    const temperatureUnit = resolveUnit(input.bytes[25]!)

    channelConfigurations.push({
      measurand: temperatureMeasurand.id,
      measurandName: temperatureMeasurand.name,
      measurementRangeStart: temperatureMeasurementRangeStart,
      measurementRangeEnd: temperatureMeasurementRangeEnd,
      unit: temperatureUnit.id,
      unitName: temperatureUnit.name,
    })
  }

  return {
    data: {
      messageType,
      configurationId,
      deviceInformation: {
        productId,
        productIdName,
        productSubId,
        productSubIdName,
        sensorDeviceTypeId,
        channelConfigurations,
      },
    },
  }
}

const handleKeepAliveMessage: Handler<TULIP2PGUChannels, PGUTULIP2DeviceStatisticsUplinkOutput> = (input) => {
  if (input.bytes.length !== 10) {
    throw new Error(`Keep alive message 08 needs 10 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const numberOfMeasurements = (((input.bytes[2]! << 24) >>> 0) + ((input.bytes[3]! << 16) >>> 0) + ((input.bytes[4]! << 8) >>> 0) + input.bytes[5]!) >>> 0
  const numberOfTransmissions = (((input.bytes[6]! << 24) >>> 0) + ((input.bytes[7]! << 16) >>> 0) + ((input.bytes[8]! << 8) >>> 0) + input.bytes[9]!) >>> 0

  const deviceStatistic: PGUTULIP2DeviceStatisticsData = {
    numberOfMeasurements,
    numberOfTransmissions,
  }

  return {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic,
    },
  }
}

const handleExtendedDeviceIdentificationMessage: Handler<TULIP2PGUChannels, PGUTULIP2ExtendedDeviceInformationUplinkOutput> = (input) => {
  if (input.bytes.length < 20 || input.bytes.length > 42) {
    throw new Error(`Extended device identification message 09 needs at least 20 and maximum 42 bytes but got ${input.bytes.length}`)
  }

  const configurationId = input.bytes[1]!
  const optionalFieldsMask = input.bytes[2]! & 0x0F
  let position = 3

  const extendedDeviceInformation: PGUTULIP2ExtendedDeviceInformationData = {
    optionalFieldsMask,
    deviceHardwareVersion: '',
    deviceSerialNumber: '',
    deviceProductCode: '',
    deviceFirmwareVersion: '',
  }

  if ((optionalFieldsMask & 0x01) !== 0) {
    const serialCharacters: string[] = []
    for (let i = position; i < position + 12; i += 1) {
      const byte = input.bytes[i]!
      if (byte === 0) {
        break
      }
      serialCharacters.push(String.fromCharCode(byte))
    }
    if (serialCharacters.length > 0) {
      extendedDeviceInformation.wikaSensorSerialNumber = serialCharacters.join('')
    }
    position += 12
  }

  if ((optionalFieldsMask & 0x02) !== 0) {
    extendedDeviceInformation.sensorLUID = ((input.bytes[position]! << 24) | (input.bytes[position + 1]! << 16) | (input.bytes[position + 2]! << 8) | input.bytes[position + 3]!) >>> 0
    position += 4
  }

  if ((optionalFieldsMask & 0x04) !== 0) {
    extendedDeviceInformation.sensorHardwareVersion = `${input.bytes[position]!}.${input.bytes[position + 1]!}.${input.bytes[position + 2]!}`
    position += 3
  }

  extendedDeviceInformation.deviceHardwareVersion = `${input.bytes[position]!}.${input.bytes[position + 1]!}.${input.bytes[position + 2]!}`
  position += 3

  if ((optionalFieldsMask & 0x08) !== 0) {
    extendedDeviceInformation.sensorFirmwareVersion = `${input.bytes[position]!}.${input.bytes[position + 1]!}.${input.bytes[position + 2]!}`
    position += 3
  }

  const digitSerialNumber = (input.bytes[position]! << 16) | (input.bytes[position + 1]! << 8) | input.bytes[position + 2]!
  const letterSerialNumber = String.fromCharCode(input.bytes[position + 3]!)
  extendedDeviceInformation.deviceSerialNumber = `${letterSerialNumber}${digitSerialNumber.toString().padStart(6, '0')}`
  position += 4

  const productCodeCharacters: string[] = []
  for (let index = position; index < position + 7; index += 1) {
    productCodeCharacters.push(String.fromCharCode(input.bytes[index]!))
  }
  extendedDeviceInformation.deviceProductCode = productCodeCharacters.join('')
  position += 7

  extendedDeviceInformation.deviceFirmwareVersion = `${input.bytes[position]!}.${input.bytes[position + 1]!}.${input.bytes[position + 2]!}`

  return {
    data: {
      messageType: 0x09,
      configurationId,
      extendedDeviceInformation,
    },
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createPGUTULIP2Codec() {
  return defineTULIP2Codec({
    deviceName: PGU_NETRIS3_NAME,
    channels: createTULIP2PGUChannels(),
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    handlers: {
      0x01: handleDataMessage,
      0x02: handleDataMessage,
      0x03: handleProcessAlarmMessage,
      0x04: handleTechnicalAlarmMessage,
      0x05: handleDeviceAlarmMessage,
      0x07: handleDeviceIdentificationMessage,
      0x08: handleKeepAliveMessage,
      0x09: handleExtendedDeviceIdentificationMessage,
    },
  })
}
