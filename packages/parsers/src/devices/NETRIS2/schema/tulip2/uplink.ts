/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createSemVerSchema } from '../../../../schemas'
import { createUplinkOutputSchemaFactory } from '../../../../schemas/tulip2/uplink'
import { NETRIS2TULIP2_CHANNEL_0, NETRIS2TULIP2_CHANNEL_1 } from '../../parser/tulip2/constants'
import { ALARM_EVENTS, CONFIGURATION_STATUS_TYPES, NETRIS2_PRODUCT_ID, NETRIS2_PRODUCT_SUB_ID, PROCESS_ALARM_TYPES, TECHNICAL_CAUSE_OF_FAILURE_NAMES } from '../../parser/tulip2/lookups'

const createUplinkSchema = createUplinkOutputSchemaFactory(31)

function createDataMessageUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x01, 0x02],
    extension: {
      measurement: v.object({
        channels: v.union([
          v.tuple([
            v.object({
              channelId: v.literal(NETRIS2TULIP2_CHANNEL_0.channelId),
              channelName: v.literal(NETRIS2TULIP2_CHANNEL_0.name),
              value: v.number(),
            }),
          ]),
          v.tuple([
            v.object({
              channelId: v.literal(NETRIS2TULIP2_CHANNEL_0.channelId),
              channelName: v.literal(NETRIS2TULIP2_CHANNEL_0.name),
              value: v.number(),
            }),
            v.object({
              channelId: v.literal(NETRIS2TULIP2_CHANNEL_1.channelId),
              channelName: v.literal(NETRIS2TULIP2_CHANNEL_1.name),
              value: v.number(),
            }),
          ]),
        ]),
      }),
    },
  })
}

function createProcessAlarmsDataSchema() {
  return v.array(
    v.union([
      v.object({
        channelId: v.union([
          v.literal(NETRIS2TULIP2_CHANNEL_0.channelId),
        ]),
        channelName: v.literal(NETRIS2TULIP2_CHANNEL_0.name),
        event: v.picklist(Object.values(ALARM_EVENTS)),
        eventName: v.picklist(Object.keys(ALARM_EVENTS) as (keyof typeof ALARM_EVENTS)[]),
        alarmType: v.picklist(Object.values(PROCESS_ALARM_TYPES)),
        alarmTypeName: v.picklist(Object.keys(PROCESS_ALARM_TYPES) as (keyof typeof PROCESS_ALARM_TYPES)[]),
        value: v.number(),
      }),
      v.object({
        channelId: v.union([
          v.literal(NETRIS2TULIP2_CHANNEL_1.channelId),
        ]),
        channelName: v.literal(NETRIS2TULIP2_CHANNEL_1.name),
        event: v.picklist(Object.values(ALARM_EVENTS)),
        eventName: v.picklist(Object.keys(ALARM_EVENTS) as (keyof typeof ALARM_EVENTS)[]),
        alarmType: v.picklist(Object.values(PROCESS_ALARM_TYPES)),
        alarmTypeName: v.picklist(Object.keys(PROCESS_ALARM_TYPES) as (keyof typeof PROCESS_ALARM_TYPES)[]),
        value: v.number(),
      }),
    ]),
  )
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
  return v.array(v.union([
    v.object({
      channelId: v.union([
        v.literal(NETRIS2TULIP2_CHANNEL_0.channelId),
      ]),
      channelName: v.literal(NETRIS2TULIP2_CHANNEL_0.name),
      event: v.picklist(Object.values(ALARM_EVENTS) as (typeof ALARM_EVENTS)[keyof typeof ALARM_EVENTS][]),
      eventName: v.picklist(Object.keys(ALARM_EVENTS) as (keyof typeof ALARM_EVENTS)[]),
      causeOfFailure: v.picklist(TECHNICAL_CAUSE_OF_FAILURE_NAMES.map((name, index) => index)),
      causeOfFailureName: v.picklist(TECHNICAL_CAUSE_OF_FAILURE_NAMES),
    }),
    v.object({
      channelId: v.union([
        v.literal(NETRIS2TULIP2_CHANNEL_1.channelId),
      ]),
      channelName: v.literal(NETRIS2TULIP2_CHANNEL_1.name),
      event: v.picklist(Object.values(ALARM_EVENTS) as (typeof ALARM_EVENTS)[keyof typeof ALARM_EVENTS][]),
      eventName: v.picklist(Object.keys(ALARM_EVENTS) as (keyof typeof ALARM_EVENTS)[]),
      causeOfFailure: v.picklist(TECHNICAL_CAUSE_OF_FAILURE_NAMES.map((name, index) => index)),
      causeOfFailureName: v.picklist(TECHNICAL_CAUSE_OF_FAILURE_NAMES),
    }),
  ]))
}

function createTechnicalAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x04],
    extension: {
      technicalAlarms: createTechnicalAlarmsDataSchema(),
    },
  })
}

function createConfigurationStatusUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x06],
    extension: {
      configurationStatus: v.object({
        statusId: v.picklist(Object.keys(CONFIGURATION_STATUS_TYPES).map(key => Number.parseInt(key, 10)) as (keyof typeof CONFIGURATION_STATUS_TYPES)[]),
        status: v.picklist(Object.values(CONFIGURATION_STATUS_TYPES)),
      }),
    },
  })
}

function createRadioUnitIdentificationUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x07],
    extension: {
      radioUnitIdentification: v.object({
        productId: v.literal(NETRIS2_PRODUCT_ID),
        productIdName: v.literal('NETRIS2'),
        productSubId: v.literal(NETRIS2_PRODUCT_SUB_ID),
        productSubIdName: v.literal('standard'),
        radioUnitModemFirmwareVersion: createSemVerSchema(),
        radioUnitModemHardwareVersion: createSemVerSchema(),
        radioUnitFirmwareVersion: createSemVerSchema(),
        radioUnitHardwareVersion: createSemVerSchema(),
        serialNumber: v.string(),
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
        batteryResetSinceLastKeepAlive: v.boolean(),
        estimatedBatteryPercent: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
        batteryCalculationError: v.boolean(),
        radioUnitTemperatureLevel_C: v.number(),
      }),
    },
  })
}

export function createNETRIS2TULIP2UplinkOutputSchema() {
  return v.union([
    createDataMessageUplinkOutputSchema(),
    createProcessAlarmsUplinkOutputSchema(),
    createTechnicalAlarmsUplinkOutputSchema(),
    createConfigurationStatusUplinkOutputSchema(),
    createRadioUnitIdentificationUplinkOutputSchema(),
    createDeviceStatisticsUplinkOutputSchema(),
  ])
}

export type NETRIS2TULIP2DataMessageData = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>['data']['measurement']
export type NETRIS2TULIP2DataMessageUplinkOutput = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>

export type NETRIS2TULIP2ProcessAlarmsData = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>['data']['processAlarms']
export type NETRIS2TULIP2ProcessAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>

export type NETRIS2TULIP2TechnicalAlarmsData = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>['data']['technicalAlarms']
export type NETRIS2TULIP2TechnicalAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>

export type NETRIS2TULIP2ConfigurationStatusData = v.InferOutput<ReturnType<typeof createConfigurationStatusUplinkOutputSchema>>['data']['configurationStatus']
export type NETRIS2TULIP2ConfigurationStatusUplinkOutput = v.InferOutput<ReturnType<typeof createConfigurationStatusUplinkOutputSchema>>

export type NETRIS2TULIP2RadioUnitIdentificationData = v.InferOutput<ReturnType<typeof createRadioUnitIdentificationUplinkOutputSchema>>['data']['radioUnitIdentification']
export type NETRIS2TULIP2RadioUnitIdentificationUplinkOutput = v.InferOutput<ReturnType<typeof createRadioUnitIdentificationUplinkOutputSchema>>

export type NETRIS2TULIP2DeviceStatisticsData = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>['data']['deviceStatistic']
export type NETRIS2TULIP2DeviceStatisticsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>
