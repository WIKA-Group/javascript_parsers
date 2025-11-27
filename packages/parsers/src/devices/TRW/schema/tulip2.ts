/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createSemVerSchema } from '../../../schemas'
import { createUplinkOutputSchemaFactory } from '../../../schemas/tulip2/uplink'
import { ALARM_EVENTS, DEVICE_ALARM_TYPES, LPP_MEASURANDS_BY_ID, LPP_UNITS_BY_ID, MEASUREMENT_ALARM_TYPES, PROCESS_ALARM_TYPES, TECHNICAL_ALARM_TYPES } from '../parser/tulip2/lookups'

// TRW supports configurationId 0..31 (align with NETRIS1 unless specified otherwise)
const createUplinkSchema = createUplinkOutputSchemaFactory(31)

// Data message (0x01, 0x02) — single channel temperature measurement
function createDataMessageUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x01, 0x02],
    extension: {
      measurement: v.object({
        channels: v.tuple([
          v.object({
            channelId: v.literal(0),
            channelName: v.literal('temperature'),
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
      channelName: v.LiteralSchema<'temperature', undefined>
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
          channelName: v.literal('temperature'),
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
        channelName: v.literal('temperature'),
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
        productIdName: v.string(),
        productId: v.pipe(v.number(), v.minValue(0), v.integer()),
        productSubId: v.pipe(v.number(), v.minValue(0), v.integer()),
        productSubIdName: v.string(),
        wirelessModuleFirmwareVersion: createSemVerSchema(),
        wirelessModuleHardwareVersion: createSemVerSchema(),
        serialNumber: v.string(),
        measurementRangeStart: v.number(),
        measurementRangeEnd: v.number(),
        measurand: v.picklist(Object.keys(LPP_MEASURANDS_BY_ID).map(key => Number.parseInt(key, 10)) as (keyof typeof LPP_MEASURANDS_BY_ID)[]),
        // Keep measurandName as free-form for now; could add a lookup later if desired
        measurandName: v.picklist(Object.values(LPP_MEASURANDS_BY_ID) as (typeof LPP_MEASURANDS_BY_ID)[keyof typeof LPP_MEASURANDS_BY_ID][]),
        unit: v.picklist(Object.keys(LPP_UNITS_BY_ID).map(key => Number.parseInt(key, 10)) as (keyof typeof LPP_UNITS_BY_ID)[]),
        unitName: v.picklist(Object.values(LPP_UNITS_BY_ID) as (typeof LPP_UNITS_BY_ID)[keyof typeof LPP_UNITS_BY_ID][]),
      }),
    },
  })
}

export function createTRWTULIP2UplinkOutputSchema() {
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
export type TRWTULIP2DataMessageData = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>['data']['measurement']
export type TRWTULIP2DataMessageUplinkOutput = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>

export type TRWTULIP2ProcessAlarmsData = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>['data']['processAlarms']
export type TRWTULIP2ProcessAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>

export type TRWTULIP2TechnicalAlarmsData = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>['data']['technicalAlarms']
export type TRWTULIP2TechnicalAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>

export type TRWTULIP2DeviceAlarmsData = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>['data']['deviceAlarm']
export type TRWTULIP2DeviceAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>

export type TRWTULIP2DeviceStatisticsData = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>['data']['deviceStatistic']
export type TRWTULIP2DeviceStatisticsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>

export type TRWTULIP2ChannelFailureAlarmData = v.InferOutput<ReturnType<typeof createChannelFailureAlarmUplinkOutputSchema>>['data']['channelFailureAlarm']
export type TRWTULIP2ChannelFailureAlarmUplinkOutput = v.InferOutput<ReturnType<typeof createChannelFailureAlarmUplinkOutputSchema>>

export type TRWTULIP2DeviceInformationData = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>['data']['deviceInformation']
export type TRWTULIP2DeviceInformationUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>
