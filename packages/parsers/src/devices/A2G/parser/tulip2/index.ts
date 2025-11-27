import type { Handler, TULIP2Channel } from '../../../../codecs/tulip2'
import type {
  A2GTULIP2DataMessageUplinkOutput,
  A2GTULIP2DeviceAlarmsUplinkOutput,
  A2GTULIP2DeviceInformationUplinkOutput,
  A2GTULIP2DeviceStatisticsUplinkOutput,
  A2GTULIP2TechnicalAlarmsUplinkOutput,
  FlowUnitId,
  FlowUnitName,
  PressureUnitId,
  PressureUnitName,
  UnitId,
  UnitName,
} from '../../schema/tulip2'
import { A2G_NAME } from '..'
import { defineTULIP2Codec } from '../../../../codecs/tulip2'
import { DEFAULT_ROUNDING_DECIMALS, intTuple4ToFloat32WithThreshold, roundValue } from '../../../../utils'
import {
  DEVICE_ALARM_FLAGS,
  HARDWARE_ASSEMBLY_TYPE_NAMES,
  LPP_MEASURAND_NAMES,
  LPP_MEASURAND_NAMES_FLOW,
  LPP_MEASURAND_NAMES_PRESSURE,
  LPP_UNIT_NAMES,
  MEASUREMENT_CHANNELS,
  PRODUCT_SUB_ID_NAMES,
  TECHNICAL_ALARM_FLAGS,
} from './lookups'

const ERROR_VALUE_TUPLE = [0xFF, 0xFF, 0xFF, 0xFF] as const

function isErrorTuple(tuple: [number, number, number, number]): boolean {
  return tuple[0] === ERROR_VALUE_TUPLE[0]
    && tuple[1] === ERROR_VALUE_TUPLE[1]
    && tuple[2] === ERROR_VALUE_TUPLE[2]
    && tuple[3] === ERROR_VALUE_TUPLE[3]
}

// eslint-disable-next-line ts/explicit-function-return-type
function createTULIP2A2GChannels() {
  return [
    {
      channelId: MEASUREMENT_CHANNELS.pressure,
      name: 'pressure',
      // start and end not used as values are in float
      start: 0 as number,
      end: 100 as number,
      adjustMeasurementRangeDisallowed: true,
    },
    {
      channelId: MEASUREMENT_CHANNELS.flow,
      name: 'flow',
      // start and end not used as values are in float
      start: 0 as number,
      end: 100 as number,
      adjustMeasurementRangeDisallowed: true,
    },
    {
      channelId: MEASUREMENT_CHANNELS.input_1,
      name: 'input_1',
      // start and end not used as values are in float
      start: 0 as number,
      end: 100 as number,
      adjustMeasurementRangeDisallowed: true,
    },
    {
      channelId: MEASUREMENT_CHANNELS.input_2,
      name: 'input_2',
      // start and end not used as values are in float
      start: 0 as number,
      end: 100 as number,
      adjustMeasurementRangeDisallowed: true,
    },
    {
      channelId: MEASUREMENT_CHANNELS.input_3,
      name: 'input_3',
      // start and end not used as values are in float
      start: 0 as number,
      end: 100 as number,
      adjustMeasurementRangeDisallowed: true,
    },
    {
      channelId: MEASUREMENT_CHANNELS.input_4,
      name: 'input_4',
      // start and end not used as values are in float
      start: 0 as number,
      end: 1 as number,
      adjustMeasurementRangeDisallowed: true,
    },
    {
      channelId: MEASUREMENT_CHANNELS.relay_status_1,
      name: 'relay_status_1',
      // start and end not used as values are in float
      start: 0 as number,
      end: 1 as number,
      adjustMeasurementRangeDisallowed: true,
    },
    {
      channelId: MEASUREMENT_CHANNELS.relay_status_2,
      name: 'relay_status_2',
      // start and end not used as values are in float
      start: 0 as number,
      end: 1 as number,
      adjustMeasurementRangeDisallowed: true,
    },
  ] as const satisfies TULIP2Channel[]
}

export type TULIP2A2GChannels = ReturnType<typeof createTULIP2A2GChannels>

function createFloatFromTuple(tuple: [number, number, number, number], roundingDecimals: number): number {
  if (isErrorTuple(tuple)) {
    throw new Error('Invalid data for channel - measurement: 0xffff, 65535')
  }
  const value = intTuple4ToFloat32WithThreshold(tuple)
  return roundValue(value, roundingDecimals)
}

const handleDataMessage: Handler<TULIP2A2GChannels, A2GTULIP2DataMessageUplinkOutput> = (input, options) => {
  if (input.bytes.length !== 6 && input.bytes.length !== 27) {
    throw new Error(`Data message (0x01) requires 6 or 27 bytes, but received ${input.bytes.length} bytes`)
  }

  const [messageType, configurationId] = [input.bytes[0]! as 1, input.bytes[1]!]
  if (input.bytes.length === 6) {
    const tuple = [input.bytes[2]!, input.bytes[3]!, input.bytes[4]!, input.bytes[5]!] as [number, number, number, number]
    const value = createFloatFromTuple(tuple, options.roundingDecimals)
    const channels = [
      {
        channelId: MEASUREMENT_CHANNELS.pressure,
        channelName: 'pressure',
        value,
      },
    ] satisfies A2GTULIP2DataMessageUplinkOutput['data']['measurement']['channels']

    return {
      data: {
        messageType,
        configurationId,
        measurement: {
          channels,
        },
      },
    } satisfies A2GTULIP2DataMessageUplinkOutput
  }

  const pressureTuple = [input.bytes[2]!, input.bytes[3]!, input.bytes[4]!, input.bytes[5]!] as [number, number, number, number]
  const flowTuple = [input.bytes[6]!, input.bytes[7]!, input.bytes[8]!, input.bytes[9]!] as [number, number, number, number]
  const input1Tuple = [input.bytes[10]!, input.bytes[11]!, input.bytes[12]!, input.bytes[13]!] as [number, number, number, number]
  const input2Tuple = [input.bytes[14]!, input.bytes[15]!, input.bytes[16]!, input.bytes[17]!] as [number, number, number, number]
  const input3Tuple = [input.bytes[18]!, input.bytes[19]!, input.bytes[20]!, input.bytes[21]!] as [number, number, number, number]
  const input4Tuple = [input.bytes[22]!, input.bytes[23]!, input.bytes[24]!, input.bytes[25]!] as [number, number, number, number]

  const pressureValue = createFloatFromTuple(pressureTuple, options.roundingDecimals)
  const flowValue = createFloatFromTuple(flowTuple, options.roundingDecimals)
  const input1Value = createFloatFromTuple(input1Tuple, options.roundingDecimals)
  const input2Value = createFloatFromTuple(input2Tuple, options.roundingDecimals)
  const input3Value = createFloatFromTuple(input3Tuple, options.roundingDecimals)
  const input4Value = createFloatFromTuple(input4Tuple, options.roundingDecimals)

  const relayByte = input.bytes[26]!

  const channels = [
    {
      channelId: MEASUREMENT_CHANNELS.pressure,
      channelName: 'pressure',
      value: pressureValue,
    },
    {
      channelId: MEASUREMENT_CHANNELS.flow,
      channelName: 'flow',
      value: flowValue,
    },
    {
      channelId: MEASUREMENT_CHANNELS.input_1,
      channelName: 'input_1',
      value: input1Value,
    },
    {
      channelId: MEASUREMENT_CHANNELS.input_2,
      channelName: 'input_2',
      value: input2Value,
    },
    {
      channelId: MEASUREMENT_CHANNELS.input_3,
      channelName: 'input_3',
      value: input3Value,
    },
    {
      channelId: MEASUREMENT_CHANNELS.input_4,
      channelName: 'input_4',
      value: input4Value,
    },
    {
      channelId: MEASUREMENT_CHANNELS.relay_status_1,
      channelName: 'relay_status_1',
      value: relayByte & 0x01,
    },
    {
      channelId: MEASUREMENT_CHANNELS.relay_status_2,
      channelName: 'relay_status_2',
      value: (relayByte >> 1) & 0x01,
    },
  ] satisfies A2GTULIP2DataMessageUplinkOutput['data']['measurement']['channels']

  return {
    data: {
      messageType,
      configurationId,
      measurement: {
        channels,
      },
    },
  } satisfies A2GTULIP2DataMessageUplinkOutput
}

const handleTechnicalAlarmMessage: Handler<TULIP2A2GChannels, A2GTULIP2TechnicalAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length !== 3) {
    throw new Error(`Technical alarm message (0x04) requires 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const statusByte = input.bytes[2]!

  const technicalAlarms = Object.fromEntries(
    TECHNICAL_ALARM_FLAGS.map(({ name, mask }) => [name, (statusByte & mask) === mask]),
  ) as A2GTULIP2TechnicalAlarmsUplinkOutput['data']['technicalAlarms']

  return {
    data: {
      messageType: 0x04,
      configurationId,
      technicalAlarms,
    },
  }
}

const handleDeviceAlarmMessage: Handler<TULIP2A2GChannels, A2GTULIP2DeviceAlarmsUplinkOutput> = (input) => {
  if (input.bytes.length !== 4) {
    throw new Error(`Device alarm message (0x05) requires 4 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const alarmByte1 = input.bytes[2]!
  const alarmByte2 = input.bytes[3]!

  const deviceAlarms = Object.fromEntries(
    DEVICE_ALARM_FLAGS.map(({ name, mask, byteIndex }) => {
      const source = byteIndex === 2 ? alarmByte1 : alarmByte2
      return [name, (source & mask) === mask]
    }),
  ) as A2GTULIP2DeviceAlarmsUplinkOutput['data']['deviceAlarms']

  return {
    data: {
      messageType: 0x05,
      configurationId,
      deviceAlarms,
    },
  }
}

const handleDeviceIdentificationMessage: Handler<TULIP2A2GChannels, A2GTULIP2DeviceInformationUplinkOutput> = (input) => {
  if (input.bytes.length !== 33 && input.bytes.length !== 38) {
    throw new Error(`Device identification message (0x07) requires 33 or 38 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const productId = input.bytes[2]!
  if (productId !== 13) {
    throw new Error(`Invalid productId ${productId} in device identification message. Expected 13 (A2G).`)
  }

  const productSubId = input.bytes[3]!
  const productSubIdName = (PRODUCT_SUB_ID_NAMES)[productSubId as keyof typeof PRODUCT_SUB_ID_NAMES]

  const sensorFirmwareVersion = `${(input.bytes[4]! >> 4).toString(10)}.${(input.bytes[4]! & 0x0F).toString(10)}.${input.bytes[5]!.toString(10)}`
  const sensorHardwareVersion = input.bytes[6]!.toString(10)

  const hardwareAssemblyTypeId = input.bytes[7]!
  const hardwareAssemblyTypeName = (HARDWARE_ASSEMBLY_TYPE_NAMES)[hardwareAssemblyTypeId as keyof typeof PRODUCT_SUB_ID_NAMES]
  if (!hardwareAssemblyTypeName) {
    throw new Error(`Unknown hardware assembly type ${hardwareAssemblyTypeId} in device identification message`)
  }

  let serialNumber = ''
  for (let i = 8; i < 24; i++) {
    const byte = input.bytes[i]!
    if (byte === 0) {
      break
    }
    serialNumber += String.fromCharCode(byte)
  }

  const measurementRangeStartPressure = intTuple4ToFloat32WithThreshold([
    input.bytes[24]!,
    input.bytes[25]!,
    input.bytes[26]!,
    input.bytes[27]!,
  ])

  const measurementRangeEndPressure = intTuple4ToFloat32WithThreshold([
    input.bytes[28]!,
    input.bytes[29]!,
    input.bytes[30]!,
    input.bytes[31]!,
  ])

  const pressureUnit = input.bytes[32]!
  const pressureUnitName = LPP_UNIT_NAMES[pressureUnit as keyof typeof LPP_UNIT_NAMES]
  if (!pressureUnitName) {
    throw new Error(`Unknown pressure unit ${pressureUnit} in device identification message`)
  }

  const channelConfigurations: A2GTULIP2DeviceInformationUplinkOutput['data']['deviceInformation']['channelConfigurations'] = [
    {
      measurand: 3,
      measurandName: LPP_MEASURAND_NAMES_PRESSURE[3],
      measurementRangeStart: measurementRangeStartPressure,
      measurementRangeEnd: measurementRangeEndPressure,
      unit: pressureUnit as PressureUnitId,
      unitName: pressureUnitName as PressureUnitName,
    },
  ]

  if (input.bytes.length === 33) {
    return {
      data: {
        messageType: 0x07,
        configurationId,
        deviceInformation: {
          productId,
          productIdName: A2G_NAME,
          productSubId,
          productSubIdName,
          sensorFirmwareVersion,
          sensorHardwareVersion,
          hardwareAssemblyTypeId,
          hardwareAssemblyTypeName,
          serialNumber,
          channelConfigurations,
        },
      },
    } satisfies A2GTULIP2DeviceInformationUplinkOutput
  }

  const flowUnit = input.bytes[33]!
  const flowUnitName = (LPP_UNIT_NAMES)[flowUnit as keyof typeof LPP_UNIT_NAMES]
  if (!flowUnitName) {
    throw new Error(`Unknown flow unit ${flowUnit} in device identification message`)
  }

  const input1Unit = input.bytes[34]!
  const input1UnitName = (LPP_UNIT_NAMES)[input1Unit as keyof typeof LPP_UNIT_NAMES]
  if (!input1UnitName) {
    throw new Error(`Unknown input 1 unit ${input1Unit} in device identification message`)
  }

  const input2Unit = input.bytes[35]!
  const input2UnitName = (LPP_UNIT_NAMES)[input2Unit as keyof typeof LPP_UNIT_NAMES]
  if (!input2UnitName) {
    throw new Error(`Unknown input 2 unit ${input2Unit} in device identification message`)
  }

  const input3Unit = input.bytes[36]!
  const input3UnitName = (LPP_UNIT_NAMES)[input3Unit as keyof typeof LPP_UNIT_NAMES]
  if (!input3UnitName) {
    throw new Error(`Unknown input 3 unit ${input3Unit} in device identification message`)
  }

  const input4Unit = input.bytes[37]!
  const input4UnitName = (LPP_UNIT_NAMES)[input4Unit as keyof typeof LPP_UNIT_NAMES]
  if (!input4UnitName) {
    throw new Error(`Unknown input 4 unit ${input4Unit} in device identification message`)
  }

  const completeChannelConfiguration: A2GTULIP2DeviceInformationUplinkOutput['data']['deviceInformation']['channelConfigurations'] = [
    channelConfigurations[0],
    {
      measurand: 6,
      measurandName: LPP_MEASURAND_NAMES_FLOW[6],
      unit: flowUnit as FlowUnitId,
      unitName: flowUnitName as FlowUnitName,
    },
    {
      measurand: 70,
      measurandName: LPP_MEASURAND_NAMES[70],
      unit: input1Unit as UnitId,
      unitName: input1UnitName as UnitName,
    },
    {
      measurand: 71,
      measurandName: LPP_MEASURAND_NAMES[71],
      unit: input2Unit as UnitId,
      unitName: input2UnitName as UnitName,
    },
    {
      measurand: 72,
      measurandName: LPP_MEASURAND_NAMES[72],
      unit: input3Unit as UnitId,
      unitName: input3UnitName as UnitName,
    },
    {
      measurand: 73,
      measurandName: LPP_MEASURAND_NAMES[73],
      unit: input4Unit as UnitId,
      unitName: input4UnitName as UnitName,
    },
  ]

  return {
    data: {
      messageType: 0x07,
      configurationId,
      deviceInformation: {
        productId,
        productIdName: A2G_NAME,
        productSubId,
        productSubIdName,
        sensorFirmwareVersion,
        sensorHardwareVersion,
        hardwareAssemblyTypeId,
        hardwareAssemblyTypeName,
        serialNumber,
        channelConfigurations: completeChannelConfiguration,
      },
    },
  } satisfies A2GTULIP2DeviceInformationUplinkOutput
}

const handleKeepAliveMessage: Handler<TULIP2A2GChannels, A2GTULIP2DeviceStatisticsUplinkOutput> = (input) => {
  if (input.bytes.length !== 3) {
    throw new Error(`Keep alive message (0x08) requires 3 bytes, but received ${input.bytes.length} bytes`)
  }

  const configurationId = input.bytes[1]!
  const statusByte = input.bytes[2]!

  if (statusByte === 0x7F) {
    throw new Error('Keep Alive message 08: The device reports an error during the calculation of the battery capacity.')
  }

  const batteryLevelNewEvent = ((statusByte & 0x80) >> 7) === 1
  const batteryLevelPercent = statusByte & 0x7F

  return {
    data: {
      messageType: 0x08,
      configurationId,
      deviceStatistic: {
        batteryLevelNewEvent,
        batteryLevelPercent,
      },
    },
  }
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP2A2GCodec() {
  return defineTULIP2Codec({
    deviceName: A2G_NAME,
    roundingDecimals: DEFAULT_ROUNDING_DECIMALS,
    channels: createTULIP2A2GChannels(),
    handlers: {
      0x01: handleDataMessage,
      0x04: handleTechnicalAlarmMessage,
      0x05: handleDeviceAlarmMessage,
      0x07: handleDeviceIdentificationMessage,
      0x08: handleKeepAliveMessage,
    },
  })
}
