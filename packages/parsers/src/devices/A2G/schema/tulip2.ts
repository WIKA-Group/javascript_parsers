/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createSemVerSchema } from '../../../schemas'
import { createUplinkOutputSchemaFactory } from '../../../schemas/tulip2/uplink'
import {
  HARDWARE_ASSEMBLY_TYPE_NAMES,
  LPP_MEASURAND_NAMES,
  LPP_UNIT_NAMES,
  MEASUREMENT_CHANNELS,
  PRODUCT_SUB_ID_NAMES,
} from '../parser/tulip2/lookups'

const createUplinkSchema = createUplinkOutputSchemaFactory(255)

type MeasurementChannelName = keyof typeof MEASUREMENT_CHANNELS

type HardwareAssemblyTypeName = (typeof HARDWARE_ASSEMBLY_TYPE_NAMES)[keyof typeof HARDWARE_ASSEMBLY_TYPE_NAMES]

type ProductSubIdName = (typeof PRODUCT_SUB_ID_NAMES)[keyof typeof PRODUCT_SUB_ID_NAMES] | 'Unknown'

type LppMeasurandName = (typeof LPP_MEASURAND_NAMES)[keyof typeof LPP_MEASURAND_NAMES]

type LppUnitName = (typeof LPP_UNIT_NAMES)[keyof typeof LPP_UNIT_NAMES]

const HARDWARE_ASSEMBLY_TYPE_ID_LIST = Object.keys(HARDWARE_ASSEMBLY_TYPE_NAMES).map(Number)
const HARDWARE_ASSEMBLY_TYPE_NAME_LIST = Object.values(HARDWARE_ASSEMBLY_TYPE_NAMES) as HardwareAssemblyTypeName[]
const PRODUCT_SUB_ID_LIST = Object.keys(PRODUCT_SUB_ID_NAMES).map(Number)
const PRODUCT_SUB_ID_NAME_LIST = [...Object.values(PRODUCT_SUB_ID_NAMES), 'Unknown'] as ProductSubIdName[]
const LPP_UNIT_ID_LIST = Object.keys(LPP_UNIT_NAMES).map(Number)
const LPP_UNIT_NAME_LIST = Object.values(LPP_UNIT_NAMES) as LppUnitName[]

function createMeasurementChannelSchema<TName extends MeasurementChannelName>(name: TName) {
  return v.object({
    channelId: v.literal(MEASUREMENT_CHANNELS[name]),
    channelName: v.literal(name),
    value: v.number(),
  })
}

function createDataMessageChannelsSchema() {
  const pressureOnly = v.tuple([
    createMeasurementChannelSchema('pressure'),
  ])

  const fullMeasurement = v.tuple([
    createMeasurementChannelSchema('pressure'),
    createMeasurementChannelSchema('flow'),
    createMeasurementChannelSchema('input_1'),
    createMeasurementChannelSchema('input_2'),
    createMeasurementChannelSchema('input_3'),
    createMeasurementChannelSchema('input_4'),
    createMeasurementChannelSchema('relay_status_1'),
    createMeasurementChannelSchema('relay_status_2'),
  ])

  return v.union([pressureOnly, fullMeasurement])
}

function createDataMessageUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x01],
    extension: {
      measurement: v.object({
        channels: createDataMessageChannelsSchema(),
      }),
    },
  })
}

function createTechnicalAlarmsSchema() {
  return v.object({
    TemperatureInput4SignalOverload: v.boolean(),
    TemperatureInput3SignalOverload: v.boolean(),
    VoltageInput2SignalOverload: v.boolean(),
    VoltageInput1SignalOverload: v.boolean(),
    ModbusCommunicationError: v.boolean(),
    AnalogOutput2SignalOverload: v.boolean(),
    AnalogOutput1SignalOverload: v.boolean(),
    PressureSignalOverload: v.boolean(),
  })
}

function createTechnicalAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x04],
    extension: {
      technicalAlarms: createTechnicalAlarmsSchema(),
    },
  })
}

function createDeviceAlarmsSchema() {
  return v.object({
    ADCConverterError: v.boolean(),
    PressureSensorNoResponseError: v.boolean(),
    PressureSensorTimeoutError: v.boolean(),
    FactoryOptionsWriteError: v.boolean(),
    FactoryOptionsDeleteError: v.boolean(),
    InvalidFactoryOptionsError: v.boolean(),
    UserSettingsInvalidError: v.boolean(),
    UserSettingsReadWriteError: v.boolean(),
    ZeroOffsetOverRangeError: v.boolean(),
    InvalidSignalSourceSpecifiedError: v.boolean(),
    AnalogOutput2OverTemperatureError: v.boolean(),
    AnalogOutput2LoadFaultError: v.boolean(),
    AnalogOutput2OverRangeError: v.boolean(),
    AnalogOutput1OverTemperatureError: v.boolean(),
    AnalogOutput1LoadFaultError: v.boolean(),
    AnalogOutput1OverRangeError: v.boolean(),
  })
}

function createDeviceAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x05],
    extension: {
      deviceAlarms: createDeviceAlarmsSchema(),
    },
  })
}

const PRESSURE_CHANNEL_CONFIGURATION_SCHEMA = v.object({
  measurand: v.literal(3),
  measurandName: v.literal(LPP_MEASURAND_NAMES[3] as LppMeasurandName),
  measurementRangeStart: v.number(),
  measurementRangeEnd: v.number(),
  unit: v.picklist(LPP_UNIT_ID_LIST),
  unitName: v.picklist(LPP_UNIT_NAME_LIST),
})

const FLOW_CHANNEL_CONFIGURATION_SCHEMA = v.object({
  measurand: v.literal(6),
  measurandName: v.literal(LPP_MEASURAND_NAMES[6] as LppMeasurandName),
  unit: v.picklist(LPP_UNIT_ID_LIST),
  unitName: v.picklist(LPP_UNIT_NAME_LIST),
  measurementRangeStart: v.optional(v.number()),
  measurementRangeEnd: v.optional(v.number()),
})

function createInputChannelConfigurationSchema<TMeasurand extends 70 | 71 | 72 | 73>(measurand: TMeasurand) {
  return v.object({
    measurand: v.literal(measurand),
    measurandName: v.literal(LPP_MEASURAND_NAMES[measurand] as LppMeasurandName),
    unit: v.picklist(LPP_UNIT_ID_LIST),
    unitName: v.picklist(LPP_UNIT_NAME_LIST),
    measurementRangeStart: v.optional(v.number()),
    measurementRangeEnd: v.optional(v.number()),
  })
}

const INPUT1_CHANNEL_CONFIGURATION_SCHEMA = createInputChannelConfigurationSchema(70)
const INPUT2_CHANNEL_CONFIGURATION_SCHEMA = createInputChannelConfigurationSchema(71)
const INPUT3_CHANNEL_CONFIGURATION_SCHEMA = createInputChannelConfigurationSchema(72)
const INPUT4_CHANNEL_CONFIGURATION_SCHEMA = createInputChannelConfigurationSchema(73)

function createChannelConfigurationsSchema() {
  return v.union([
    v.tuple([
      PRESSURE_CHANNEL_CONFIGURATION_SCHEMA,
    ]),
    v.tuple([
      PRESSURE_CHANNEL_CONFIGURATION_SCHEMA,
      FLOW_CHANNEL_CONFIGURATION_SCHEMA,
      INPUT1_CHANNEL_CONFIGURATION_SCHEMA,
      INPUT2_CHANNEL_CONFIGURATION_SCHEMA,
      INPUT3_CHANNEL_CONFIGURATION_SCHEMA,
      INPUT4_CHANNEL_CONFIGURATION_SCHEMA,
    ]),
  ])
}

function createDeviceInformationUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x07],
    extension: {
      deviceInformation: v.object({
        productId: v.literal(13),
        productIdName: v.literal('A2G'),
        productSubId: v.picklist(PRODUCT_SUB_ID_LIST),
        productSubIdName: v.picklist(PRODUCT_SUB_ID_NAME_LIST),
        sensorFirmwareVersion: createSemVerSchema(),
        sensorHardwareVersion: v.string(),
        hardwareAssemblyTypeId: v.picklist(HARDWARE_ASSEMBLY_TYPE_ID_LIST),
        hardwareAssemblyTypeName: v.picklist(HARDWARE_ASSEMBLY_TYPE_NAME_LIST),
        serialNumber: v.string(),
        channelConfigurations: createChannelConfigurationsSchema(),
      }),
    },
  })
}

function createDeviceStatisticsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x08],
    extension: {
      deviceStatistic: v.object({
        batteryLevelNewEvent: v.boolean(),
        batteryLevelPercent: v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()),
      }),
    },
  })
}

export function createA2GTULIP2UplinkOutputSchema() {
  return v.union([
    createDataMessageUplinkOutputSchema(),
    createTechnicalAlarmsUplinkOutputSchema(),
    createDeviceAlarmsUplinkOutputSchema(),
    createDeviceInformationUplinkOutputSchema(),
    createDeviceStatisticsUplinkOutputSchema(),
  ])
}

export type A2GTULIP2DataMessageUplinkOutput = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>
export type A2GTULIP2TechnicalAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>
export type A2GTULIP2DeviceAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>
export type A2GTULIP2DeviceInformationUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>
export type A2GTULIP2DeviceStatisticsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>
