/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createSemVerSchema } from '../../../schemas'
import { createUplinkOutputSchemaFactory } from '../../../schemas/tulip2/uplink'
import { ALARM_EVENTS, DEVICE_ALARM_TYPES, LPP_MEASURANDS_BY_ID, LPP_UNITS_BY_ID, LPWAN_IDS_BY_ID, MEASUREMENT_ALARM_TYPES, PROCESS_ALARM_TYPES, PRODUCT_IDS_BY_ID, SENSOR_IDS_BY_ID, TECHNICAL_ALARM_TYPES } from '../parser/tulip2/lookups'

// NETRIS1 supports configurationId 0..31 (align with PEW unless specified otherwise)
const createUplinkSchema = createUplinkOutputSchemaFactory(31)

// Measurand and Unit lists
const MEASURAND_IDS = Object.keys(LPP_MEASURANDS_BY_ID).map(key => Number.parseInt(key, 10)) as (keyof typeof LPP_MEASURANDS_BY_ID)[]
const MEASURAND_NAMES = Object.values(LPP_MEASURANDS_BY_ID) as (typeof LPP_MEASURANDS_BY_ID)[keyof typeof LPP_MEASURANDS_BY_ID][]

const UNIT_IDS = Object.keys(LPP_UNITS_BY_ID).map(key => Number.parseInt(key, 10)) as (keyof typeof LPP_UNITS_BY_ID)[]
const UNIT_NAMES = Object.values(LPP_UNITS_BY_ID) as (typeof LPP_UNITS_BY_ID)[keyof typeof LPP_UNITS_BY_ID][]

const PRODUCT_IDS = Object.keys(PRODUCT_IDS_BY_ID).map(key => Number.parseInt(key)) as (keyof typeof PRODUCT_IDS_BY_ID)[]
const PRODUCT_ID_NAMES = Object.values(PRODUCT_IDS_BY_ID) as (typeof PRODUCT_IDS_BY_ID)[keyof typeof PRODUCT_IDS_BY_ID][]

const SENSOR_IDS = Object.keys(SENSOR_IDS_BY_ID).map(key => Number.parseInt(key)) as (keyof typeof SENSOR_IDS_BY_ID)[]
const SENSOR_ID_NAMES = Object.values(SENSOR_IDS_BY_ID) as (typeof SENSOR_IDS_BY_ID)[keyof typeof SENSOR_IDS_BY_ID][]

const LPWAN_IDS = Object.keys(LPWAN_IDS_BY_ID).map(key => Number.parseInt(key)) as [number, ...number[]]
const LPWAN_ID_NAMES = Object.values(LPWAN_IDS_BY_ID) as [string, ...string[]]

export type MeasurandName = typeof LPP_MEASURANDS_BY_ID[keyof typeof LPP_MEASURANDS_BY_ID]
export type MeasurandId = keyof typeof LPP_MEASURANDS_BY_ID

export type UnitName = typeof LPP_UNITS_BY_ID[keyof typeof LPP_UNITS_BY_ID]
export type UnitId = keyof typeof LPP_UNITS_BY_ID

export type ProductIdName = typeof PRODUCT_IDS_BY_ID[keyof typeof PRODUCT_IDS_BY_ID]
export type SensorIdName = typeof SENSOR_IDS_BY_ID[keyof typeof SENSOR_IDS_BY_ID]
export type LpwanIdName = typeof LPWAN_IDS_BY_ID[keyof typeof LPWAN_IDS_BY_ID]

// Data message (0x01, 0x02) — single channel measurement
function createDataMessageUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x01, 0x02],
    extension: {
      measurement: v.object({
        channels: v.tuple([
          v.object({
            channelId: v.literal(0),
            channelName: v.literal('measurement'),
            value: v.number(),
          }),
        ]),
      }),
    },
  })
}

// Process alarm (0x03)
type ProcessAlarmsPossibility = {
  [AlarmEvent in keyof typeof ALARM_EVENTS]: {
    [AlarmType in keyof typeof PROCESS_ALARM_TYPES]: v.ObjectSchema<{
      sensorId: v.LiteralSchema<0, undefined>
      channelId: v.LiteralSchema<0, undefined>
      channelName: v.LiteralSchema<'measurement', undefined>
      event: v.LiteralSchema<typeof ALARM_EVENTS[AlarmEvent], undefined>
      eventName: v.LiteralSchema<AlarmEvent, undefined>
      alarmType: v.LiteralSchema<typeof PROCESS_ALARM_TYPES[AlarmType], undefined>
      alarmTypeName: v.LiteralSchema<AlarmType, undefined>
      value: v.NumberSchema<undefined>
    }, undefined>
  }[keyof typeof PROCESS_ALARM_TYPES]
}[keyof typeof ALARM_EVENTS]

function createProcessAlarmsDataSchema() {
  const pos: ProcessAlarmsPossibility[] = []
  Object.keys(ALARM_EVENTS).forEach((eventName) => {
    Object.keys(PROCESS_ALARM_TYPES).forEach((alarmTypeName) => {
      pos.push(
        v.object({
          sensorId: v.literal(0),
          channelId: v.literal(0),
          channelName: v.literal('measurement'),
          event: v.literal(ALARM_EVENTS[eventName as keyof typeof ALARM_EVENTS]),
          eventName: v.literal(eventName as keyof typeof ALARM_EVENTS),
          alarmType: v.literal(PROCESS_ALARM_TYPES[alarmTypeName as keyof typeof PROCESS_ALARM_TYPES]),
          alarmTypeName: v.literal(alarmTypeName as keyof typeof PROCESS_ALARM_TYPES),
          value: v.number(),
        }) as ProcessAlarmsPossibility,
      )
    })
  })
  return v.array(v.union(pos))
}

function createProcessAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x03],
    extension: {
      processAlarms: createProcessAlarmsDataSchema(),
    },
  })
}

// Technical alarm (0x04)
function createTechnicalAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x04],
    extension: {
      technicalAlarms: v.tuple([
        v.object({
          sensorId: v.literal(0),
          alarmType: v.pipe(v.number(), v.minValue(0), v.integer()),
          alarmTypeNames: v.array(v.picklist(Object.keys(TECHNICAL_ALARM_TYPES) as (keyof typeof TECHNICAL_ALARM_TYPES)[])),
        }),
      ]),
    },
  })
}

// Device alarm (0x05)
function createDeviceAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x05],
    extension: {
      deviceAlarm: v.object({
        alarmType: v.pipe(v.number(), v.minValue(0), v.integer()),
        alarmTypeNames: v.array(v.picklist(Object.keys(DEVICE_ALARM_TYPES) as (keyof typeof DEVICE_ALARM_TYPES)[])),
      }),
    },
  })
}

// Keep-alive (0x08)
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

// Channel failure alarm (0x09)
function createChannelFailureAlarmUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x09],
    extension: {
      channelFailureAlarm: v.object({
        sensorId: v.literal(0),
        channelId: v.literal(0),
        channelName: v.literal('measurement'),
        alarmType: v.pipe(v.number(), v.minValue(0), v.integer()),
        alarmTypeNames: v.array(v.picklist(Object.keys(MEASUREMENT_ALARM_TYPES) as (keyof typeof MEASUREMENT_ALARM_TYPES)[])),
      }),
    },
  })
}

// Device identification (0x07)
function createDeviceInformationUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x07],
    extension: {
      deviceInformation: v.object({
        productId: v.picklist(PRODUCT_IDS),
        productIdName: v.picklist(PRODUCT_ID_NAMES),
        sensorId: v.picklist(SENSOR_IDS),
        sensorIdName: v.picklist(SENSOR_ID_NAMES),
        productSubId: v.pipe(v.number(), v.integer()),
        productSubIdName: v.string(),
        lpwanId: v.picklist(LPWAN_IDS),
        lpwanIdName: v.picklist(LPWAN_ID_NAMES),
        wirelessModuleFirmwareVersion: createSemVerSchema(),
        wirelessModuleHardwareVersion: createSemVerSchema(),
        serialNumber: v.string(),
        measurementRangeStart: v.number(),
        measurementRangeEnd: v.number(),
        measurand: v.picklist(MEASURAND_IDS),
        measurandName: v.picklist(MEASURAND_NAMES),
        unit: v.picklist(UNIT_IDS),
        unitName: v.picklist(UNIT_NAMES),
      }),
    },
  })
}

export function createNETRIS1TULIP2UplinkOutputSchema() {
  return v.union([
    createDataMessageUplinkOutputSchema(),
    createProcessAlarmsUplinkOutputSchema(),
    createTechnicalAlarmsUplinkOutputSchema(),
    createDeviceAlarmsUplinkOutputSchema(),
    createDeviceStatisticsUplinkOutputSchema(),
    createDeviceInformationUplinkOutputSchema(),
    createChannelFailureAlarmUplinkOutputSchema(),
  ])
}

// Types
export type NETRIS1TULIP2DataMessageData = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>['data']['measurement']
export type NETRIS1TULIP2DataMessageUplinkOutput = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>

export type NETRIS1TULIP2ProcessAlarmsData = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>['data']['processAlarms']
export type NETRIS1TULIP2ProcessAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>

export type NETRIS1TULIP2TechnicalAlarmsData = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>['data']['technicalAlarms']
export type NETRIS1TULIP2TechnicalAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>

export type NETRIS1TULIP2DeviceAlarmsData = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>['data']['deviceAlarm']
export type NETRIS1TULIP2DeviceAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>

export type NETRIS1TULIP2DeviceStatisticsData = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>['data']['deviceStatistic']
export type NETRIS1TULIP2DeviceStatisticsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>

export type NETRIS1TULIP2ChannelFailureAlarmData = v.InferOutput<ReturnType<typeof createChannelFailureAlarmUplinkOutputSchema>>['data']['channelFailureAlarm']
export type NETRIS1TULIP2ChannelFailureAlarmUplinkOutput = v.InferOutput<ReturnType<typeof createChannelFailureAlarmUplinkOutputSchema>>

export type NETRIS1TULIP2DeviceInformationData = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>['data']['deviceInformation']
export type NETRIS1TULIP2DeviceInformationUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>
