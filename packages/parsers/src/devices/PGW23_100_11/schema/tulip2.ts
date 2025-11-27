/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createSemVerSchema } from '../../../schemas'
import { createUplinkOutputSchemaFactory } from '../../../schemas/tulip2/uplink'
import {
  ALARM_EVENTS,
  DEVICE_ALARM_CAUSE_OF_FAILURE,
  DEVICE_ALARM_TYPES,
  MEASUREMENT_CHANNELS,
  PRESSURE_TYPES,
  PRESSURE_UNITS,
  PROCESS_ALARM_CHANNEL_NAMES,
  PROCESS_ALARM_TYPES,
  TECHNICAL_ALARM_CAUSE_OF_FAILURE,
  TEMPERATURE_UNITS,
} from '../parser/tulip2/lookups'

const createUplinkSchema = createUplinkOutputSchemaFactory(31)

type ProcessAlarmChannelName = keyof typeof PROCESS_ALARM_CHANNEL_NAMES
type AlarmEventName = keyof typeof ALARM_EVENTS
type ProcessAlarmTypeName = keyof typeof PROCESS_ALARM_TYPES
type TechnicalCauseName = keyof typeof TECHNICAL_ALARM_CAUSE_OF_FAILURE
type DeviceAlarmTypeName = keyof typeof DEVICE_ALARM_TYPES
type DeviceAlarmCauseName = keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE
export type PressureTypeName = keyof typeof PRESSURE_TYPES
export type PressureUnitName = keyof typeof PRESSURE_UNITS
export type PressureUnitValues = typeof PRESSURE_UNITS[PressureUnitName]
export type TemperatureUnitName = keyof typeof TEMPERATURE_UNITS
export type TemperatureUnitValues = typeof TEMPERATURE_UNITS[TemperatureUnitName]

const PROCESS_ALARM_CHANNEL_NAME_LIST = Object.keys(PROCESS_ALARM_CHANNEL_NAMES) as ProcessAlarmChannelName[]
const ALARM_EVENT_NAME_LIST = Object.keys(ALARM_EVENTS) as AlarmEventName[]
const PROCESS_ALARM_TYPE_NAME_LIST = Object.keys(PROCESS_ALARM_TYPES) as ProcessAlarmTypeName[]
const TECHNICAL_CAUSE_NAME_LIST = Object.keys(TECHNICAL_ALARM_CAUSE_OF_FAILURE) as TechnicalCauseName[]
const DEVICE_ALARM_TYPE_NAME_LIST = Object.keys(DEVICE_ALARM_TYPES) as DeviceAlarmTypeName[]
const DEVICE_ALARM_CAUSE_NAME_LIST = Object.keys(DEVICE_ALARM_CAUSE_OF_FAILURE) as DeviceAlarmCauseName[]
const PRESSURE_TYPE_NAME_LIST = Object.keys(PRESSURE_TYPES) as PressureTypeName[]
const PRESSURE_UNIT_NAME_LIST = Object.keys(PRESSURE_UNITS) as PressureUnitName[]
const PRESSURE_UNIT_VALUES = Object.values(PRESSURE_UNITS) as PressureUnitValues[]
const TEMPERATURE_UNIT_NAME_LIST = Object.keys(TEMPERATURE_UNITS) as TemperatureUnitName[]
const TEMPERATURE_UNIT_VALUES = Object.values(TEMPERATURE_UNITS) as TemperatureUnitValues[]

function createChannelMeasurement<TName extends keyof typeof MEASUREMENT_CHANNELS>(name: TName) {
  return v.object({
    channelId: v.literal(MEASUREMENT_CHANNELS[name]),
    channelName: v.literal(name),
    value: v.number(),
  })
}

function createDataMessageUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x01, 0x02],
    extension: {
      measurement: v.object({
        channels: v.tuple([
          createChannelMeasurement('pressure'),
          createChannelMeasurement('device temperature'),
          createChannelMeasurement('battery voltage'),
        ]),
      }),
    },
  })
}

function createProcessAlarmsDataSchema() {
  const schemas: v.ObjectSchema<any, any>[] = []

  PROCESS_ALARM_CHANNEL_NAME_LIST.forEach((channelName) => {
    const channelId = PROCESS_ALARM_CHANNEL_NAMES[channelName]

    ALARM_EVENT_NAME_LIST.forEach((eventName) => {
      PROCESS_ALARM_TYPE_NAME_LIST.forEach((alarmTypeName) => {
        schemas.push(
          v.object({
            channelId: v.literal(channelId),
            channelName: v.literal(channelName),
            event: v.literal(ALARM_EVENTS[eventName]),
            eventName: v.literal(eventName),
            alarmType: v.literal(PROCESS_ALARM_TYPES[alarmTypeName]),
            alarmTypeName: v.literal(alarmTypeName),
            value: v.number(),
          }),
        )
      })
    })
  })

  return v.array(v.union(schemas))
}

function createProcessAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x03],
    extension: {
      processAlarms: createProcessAlarmsDataSchema(),
    },
  })
}

function createTechnicalAlarmsDataSchema() {
  const schemas: v.ObjectSchema<any, any>[] = []

  ALARM_EVENT_NAME_LIST.forEach((eventName) => {
    TECHNICAL_CAUSE_NAME_LIST.forEach((causeName) => {
      PROCESS_ALARM_CHANNEL_NAME_LIST.forEach((channelName) => {
        const channelId = PROCESS_ALARM_CHANNEL_NAMES[channelName]

        schemas.push(
          v.object({
            event: v.literal(ALARM_EVENTS[eventName]),
            eventName: v.literal(eventName),
            channelId: v.literal(channelId),
            channelName: v.literal(channelName),
            causeOfFailure: v.literal(TECHNICAL_ALARM_CAUSE_OF_FAILURE[causeName]),
            causeOfFailureName: v.literal(causeName),
            value: v.number(),
          }),
        )
      })
    })
  })

  return v.array(v.union(schemas))
}

function createTechnicalAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x04],
    extension: {
      technicalAlarms: createTechnicalAlarmsDataSchema(),
    },
  })
}

function createDeviceAlarmsDataSchema() {
  const schemas: v.ObjectSchema<any, any>[] = []

  ALARM_EVENT_NAME_LIST.forEach((eventName) => {
    DEVICE_ALARM_TYPE_NAME_LIST.forEach((alarmTypeName) => {
      DEVICE_ALARM_CAUSE_NAME_LIST.forEach((causeName) => {
        schemas.push(
          v.object({
            event: v.literal(ALARM_EVENTS[eventName]),
            eventName: v.literal(eventName),
            alarmType: v.literal(DEVICE_ALARM_TYPES[alarmTypeName]),
            alarmTypeName: v.literal(alarmTypeName),
            causeOfFailure: v.literal(DEVICE_ALARM_CAUSE_OF_FAILURE[causeName]),
            causeOfFailureName: v.literal(causeName),
            value: v.number(),
          }),
        )
      })
    })
  })

  return v.union(schemas)
}

function createDeviceAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x05],
    extension: {
      deviceAlarm: createDeviceAlarmsDataSchema(),
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

function createDeviceInformationUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x07],
    extension: {
      deviceInformation: v.object({
        productIdName: v.string(),
        productId: v.pipe(v.number(), v.minValue(0), v.integer()),
        wirelessModuleFirmwareVersion: createSemVerSchema(),
        wirelessModuleHardwareVersion: createSemVerSchema(),
        sensorModuleFirmwareVersion: createSemVerSchema(),
        sensorModuleHardwareVersion: createSemVerSchema(),
        serialNumber: v.string(),
        pressureType: v.picklist(PRESSURE_TYPE_NAME_LIST),
        measurementRangeStartPressure: v.number(),
        measurementRangeEndPressure: v.number(),
        measurementRangeStartDeviceTemperature: v.number(),
        measurementRangeEndDeviceTemperature: v.number(),
        pressureUnit: v.picklist(PRESSURE_UNIT_VALUES),
        pressureUnitName: v.picklist(PRESSURE_UNIT_NAME_LIST),
        deviceTemperatureUnit: v.picklist(TEMPERATURE_UNIT_VALUES),
        deviceTemperatureUnitName: v.picklist(TEMPERATURE_UNIT_NAME_LIST),
      }),
    },
  })
}

export type PGW23_100_11TULIP2UplinkOutputDeviceInformation = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>

export function createPGW23_100_11TULIP2UplinkOutputSchema() {
  return v.union([
    createDataMessageUplinkOutputSchema(),
    createProcessAlarmsUplinkOutputSchema(),
    createTechnicalAlarmsUplinkOutputSchema(),
    createDeviceAlarmsUplinkOutputSchema(),
    createDeviceInformationUplinkOutputSchema(),
    createDeviceStatisticsUplinkOutputSchema(),
  ])
}

export type PGW23_100_11TULIP2DataMessageData = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>['data']['measurement']
export type PGW23_100_11TULIP2DataMessageUplinkOutput = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>

export type PGW23_100_11TULIP2ProcessAlarmsData = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>['data']['processAlarms']
export type PGW23_100_11TULIP2ProcessAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>

export type PGW23_100_11TULIP2TechnicalAlarmsData = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>['data']['technicalAlarms']
export type PGW23_100_11TULIP2TechnicalAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>

export type PGW23_100_11TULIP2DeviceAlarmsData = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>['data']['deviceAlarm']
export type PGW23_100_11TULIP2DeviceAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>

export type PGW23_100_11TULIP2DeviceInformationData = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>['data']['deviceInformation']
export type PGW23_100_11TULIP2DeviceInformationUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>

export type PGW23_100_11TULIP2DeviceStatisticsData = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>['data']['deviceStatistic']
export type PGW23_100_11TULIP2DeviceStatisticsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>
