/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createSemVerSchema } from '../../../schemas'
import { createUplinkOutputSchemaFactory } from '../../../schemas/tulip2/uplink'
import { TRUTULIP2_TEMPERATURE_CHANNEL } from '../parser/tulip2/channels'
import { ALARM_EVENTS, DEVICE_ALARM_STATUS_TYPES, LPP_MEASURANDS_BY_ID, LPP_UNITS_BY_ID, PROCESS_ALARM_TYPES, PRODUCT_SUB_ID_NAMES, TECHNICAL_ALARM_TYPES, TECHNICAL_CAUSE_OF_FAILURE_NAMES } from '../parser/tulip2/lookups'

const createUplinkSchema = createUplinkOutputSchemaFactory(31)

function createDataMessageUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x01, 0x02],
    extension: {
      measurement: v.object({
        channels: v.array(v.object({
          channelId: v.literal(TRUTULIP2_TEMPERATURE_CHANNEL.channelId),
          channelName: v.literal(TRUTULIP2_TEMPERATURE_CHANNEL.name),
          value: v.number(),
        })),
      }),
    },
  })
}

function createProcessAlarmsDataSchema() {
  return v.array(v.object({
    channelId: v.literal(TRUTULIP2_TEMPERATURE_CHANNEL.channelId),
    channelName: v.literal(TRUTULIP2_TEMPERATURE_CHANNEL.name),
    event: v.picklist(Object.values(ALARM_EVENTS)),
    eventName: v.picklist(Object.keys(ALARM_EVENTS) as (keyof typeof ALARM_EVENTS)[]),
    alarmType: v.picklist(Object.values(PROCESS_ALARM_TYPES)),
    alarmTypeName: v.picklist(Object.keys(PROCESS_ALARM_TYPES) as (keyof typeof PROCESS_ALARM_TYPES)[]),
    value: v.number(),
  }))
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
  return v.array(v.object({
    alarmType: v.pipe(v.number(), v.minValue(0), v.integer()),
    alarmTypeName: v.picklist(Object.keys(TECHNICAL_ALARM_TYPES) as (keyof typeof TECHNICAL_ALARM_TYPES)[]),
    causeOfFailure: v.pipe(v.number(), v.minValue(0), v.integer()),
    causeOfFailureName: v.picklist(TECHNICAL_CAUSE_OF_FAILURE_NAMES),
  }))
}

function createTechnicalAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x04],
    extension: {
      technicalAlarms: createTechnicalAlarmsDataSchema(),
    },
  })
}

function createDeviceAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x05],
    extension: {
      deviceAlarm: v.object({
        alarmStatus: v.pipe(v.number(), v.minValue(0), v.integer()),
        alarmStatusNames: v.array(v.picklist(Object.keys(DEVICE_ALARM_STATUS_TYPES) as (keyof typeof DEVICE_ALARM_STATUS_TYPES)[])),
      }),
    },
  })
}

function createDeviceInformationUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x07],
    extension: {
      deviceInformation: v.object({
        productId: v.pipe(v.number(), v.minValue(0), v.integer()),
        productIdName: v.union([
          v.literal('NETRIS3'),
          v.number(),
        ]),
        productSubId: v.pipe(v.number(), v.minValue(0), v.integer()),
        productSubIdName: v.picklist(Object.keys(PRODUCT_SUB_ID_NAMES) as (keyof typeof PRODUCT_SUB_ID_NAMES)[]),
        sensorDeviceTypeId: v.pipe(v.number(), v.minValue(0), v.integer()),
        channelConfigurations: v.tuple([
          v.object({
            channelId: v.literal(TRUTULIP2_TEMPERATURE_CHANNEL.channelId),
            channelName: v.literal(TRUTULIP2_TEMPERATURE_CHANNEL.name),
            measurand: v.picklist(Object.keys(LPP_MEASURANDS_BY_ID).map(key => Number.parseInt(key, 10)) as (keyof typeof LPP_MEASURANDS_BY_ID)[]),
            measurandName: v.picklist(Object.values(LPP_MEASURANDS_BY_ID) as (typeof LPP_MEASURANDS_BY_ID)[keyof typeof LPP_MEASURANDS_BY_ID][]),
            measurementRangeStart: v.number(),
            measurementRangeEnd: v.number(),
            unit: v.picklist(Object.keys(LPP_UNITS_BY_ID).map(key => Number.parseInt(key, 10)) as (keyof typeof LPP_UNITS_BY_ID)[]),
            unitName: v.picklist(Object.values(LPP_UNITS_BY_ID) as (typeof LPP_UNITS_BY_ID)[keyof typeof LPP_UNITS_BY_ID][]),
          }),
        ]),
      }),
    },
  })
}

function createDeviceStatisticsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x08],
    extension: {
      deviceStatistic: v.object({
        numberOfMeasurements: v.pipe(v.number(), v.minValue(0), v.integer()),
        numberOfTransmissions: v.pipe(v.number(), v.minValue(0), v.integer()),
      }),
    },
  })
}

function createExtendedDeviceInformationUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x09],
    extension: {
      extendedDeviceInformation: v.object({
        optionalFieldsMask: v.pipe(v.number(), v.minValue(0), v.maxValue(0x0F), v.integer()),
        wikaSensorSerialNumber: v.optional(v.string()),
        sensorLUID: v.optional(v.pipe(v.number(), v.minValue(0), v.integer())),
        sensorHardwareVersion: v.optional(createSemVerSchema()),
        deviceHardwareVersion: createSemVerSchema(),
        sensorFirmwareVersion: v.optional(createSemVerSchema()),
        deviceSerialNumber: v.string(),
        deviceProductCode: v.string(),
        deviceFirmwareVersion: createSemVerSchema(),
      }),
    },
  })
}

export function createTRUTULIP2UplinkOutputSchema() {
  return v.union([
    createDataMessageUplinkOutputSchema(),
    createProcessAlarmsUplinkOutputSchema(),
    createTechnicalAlarmsUplinkOutputSchema(),
    createDeviceAlarmsUplinkOutputSchema(),
    createDeviceInformationUplinkOutputSchema(),
    createDeviceStatisticsUplinkOutputSchema(),
    createExtendedDeviceInformationUplinkOutputSchema(),
  ])
}

export type TRUTULIP2DataMessageData = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>['data']['measurement']
export type TRUTULIP2DataMessageUplinkOutput = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>

export type TRUTULIP2ProcessAlarmsData = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>['data']['processAlarms']
export type TRUTULIP2ProcessAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>

export type TRUTULIP2TechnicalAlarmsData = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>['data']['technicalAlarms']
export type TRUTULIP2TechnicalAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>

export type TRUTULIP2DeviceAlarmsData = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>['data']['deviceAlarm']
export type TRUTULIP2DeviceAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>

export type TRUTULIP2DeviceInformationData = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>['data']['deviceInformation']
export type TRUTULIP2DeviceInformationUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>

export type TRUTULIP2DeviceStatisticsData = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>['data']['deviceStatistic']
export type TRUTULIP2DeviceStatisticsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>

export type TRUTULIP2ExtendedDeviceInformationData = v.InferOutput<ReturnType<typeof createExtendedDeviceInformationUplinkOutputSchema>>['data']['extendedDeviceInformation']
export type TRUTULIP2ExtendedDeviceInformationUplinkOutput = v.InferOutput<ReturnType<typeof createExtendedDeviceInformationUplinkOutputSchema>>
