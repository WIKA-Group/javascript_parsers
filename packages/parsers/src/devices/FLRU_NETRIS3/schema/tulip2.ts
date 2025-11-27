/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createSemVerSchema } from '../../../schemas'
import { createUplinkOutputSchemaFactory } from '../../../schemas/tulip2/uplink'
import { FLRUTULIP2_LEVEL_CHANNEL } from '../parser/tulip2/channels'
import { ALARM_EVENTS, DEVICE_ALARM_STATUS_TYPES, PROCESS_ALARM_TYPES, TECHNICAL_ALARM_TYPES, TECHNICAL_CAUSE_OF_FAILURE_NAMES } from '../parser/tulip2/lookups'

const createUplinkSchema = createUplinkOutputSchemaFactory(31)

function createDataMessageUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x01, 0x02],
    extension: {
      measurement: v.object({
        channels: v.array(v.object({
          channelId: v.literal(FLRUTULIP2_LEVEL_CHANNEL.channelId),
          channelName: v.literal(FLRUTULIP2_LEVEL_CHANNEL.name),
          value: v.number(),
        })),
      }),
    },
  })
}

function createProcessAlarmsDataSchema() {
  return v.array(v.object({
    channelId: v.literal(FLRUTULIP2_LEVEL_CHANNEL.channelId),
    channelName: v.literal(FLRUTULIP2_LEVEL_CHANNEL.name),
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
        productId: v.literal(15),
        productIdName: v.literal('NETRIS3'),
        productSubId: v.literal(0),
        productSubIdName: v.literal('LoRaWAN'),
        sensorDeviceTypeId: v.literal(20),
        channelConfigurations: v.tuple([
          v.object({
            channelId: v.literal(FLRUTULIP2_LEVEL_CHANNEL.channelId),
            channelName: v.literal(FLRUTULIP2_LEVEL_CHANNEL.name),
            measurand: v.literal(10),
            measurandName: v.literal('Level'),
            measurementRangeStart: v.number(),
            measurementRangeEnd: v.number(),
            unit: v.picklist([0x3C, 0x3D, 0x3E, 0x3F, 0x40, 0x41] as const),
            unitName: v.picklist(['mm', 'cm', 'm', 'µm', 'ft', 'in'] as const),
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

export function createFLRUTULIP2UplinkOutputSchema() {
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

export type FLRUTULIP2DataMessageData = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>['data']['measurement']
export type FLRUTULIP2DataMessageUplinkOutput = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>

export type FLRUTULIP2ProcessAlarmsData = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>['data']['processAlarms']
export type FLRUTULIP2ProcessAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>

export type FLRUTULIP2TechnicalAlarmsData = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>['data']['technicalAlarms']
export type FLRUTULIP2TechnicalAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>

export type FLRUTULIP2DeviceAlarmsData = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>['data']['deviceAlarm']
export type FLRUTULIP2DeviceAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>

export type FLRUTULIP2DeviceInformationData = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>['data']['deviceInformation']
export type FLRUTULIP2DeviceInformationUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>

export type FLRUTULIP2DeviceStatisticsData = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>['data']['deviceStatistic']
export type FLRUTULIP2DeviceStatisticsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>

export type FLRUTULIP2ExtendedDeviceInformationData = v.InferOutput<ReturnType<typeof createExtendedDeviceInformationUplinkOutputSchema>>['data']['extendedDeviceInformation']
export type FLRUTULIP2ExtendedDeviceInformationUplinkOutput = v.InferOutput<ReturnType<typeof createExtendedDeviceInformationUplinkOutputSchema>>
