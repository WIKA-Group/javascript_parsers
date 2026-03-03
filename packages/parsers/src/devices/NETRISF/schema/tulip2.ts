/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputSchemaFactory } from '../../../schemas/tulip2/uplink'
import { NETRISF_BATTERY_VOLTAGE_CHANNEL, NETRISF_DEVICE_TEMPERATURE_CHANNEL, NETRISF_STRAIN_CHANNEL } from '../parser/tulip2/channels'
import {
  ALARM_EVENTS,
  CONFIG_STATUS_NAMES_BY_VALUE,
  DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE,
  DEVICE_ALARM_TYPES,
  PHYSICAL_UNIT_NAMES_STRAIN,
  PHYSICAL_UNIT_NAMES_TEMPERATURE,
  PROCESS_ALARM_CHANNEL_NAMES_BY_ID,
  PROCESS_ALARM_TYPES,
  STRAIN_TYPES_BY_ID,
  TECHNICAL_ALARM_TYPES,
} from '../parser/tulip2/lookups'

const createUplinkSchema = createUplinkOutputSchemaFactory(255)

// Strain unit lists
const STRAIN_UNIT_ID_LIST = Object.keys(PHYSICAL_UNIT_NAMES_STRAIN).map(Number) as (keyof typeof PHYSICAL_UNIT_NAMES_STRAIN)[]
const STRAIN_UNIT_NAME_LIST = Object.values(PHYSICAL_UNIT_NAMES_STRAIN) as typeof PHYSICAL_UNIT_NAMES_STRAIN[keyof typeof PHYSICAL_UNIT_NAMES_STRAIN][]

export type StrainUnitName = typeof PHYSICAL_UNIT_NAMES_STRAIN[keyof typeof PHYSICAL_UNIT_NAMES_STRAIN]
export type StrainUnitId = keyof typeof PHYSICAL_UNIT_NAMES_STRAIN

// Temperature unit lists
const TEMPERATURE_UNIT_ID_LIST = Object.keys(PHYSICAL_UNIT_NAMES_TEMPERATURE).map(Number) as (keyof typeof PHYSICAL_UNIT_NAMES_TEMPERATURE)[]
const TEMPERATURE_UNIT_NAME_LIST = Object.values(PHYSICAL_UNIT_NAMES_TEMPERATURE) as typeof PHYSICAL_UNIT_NAMES_TEMPERATURE[keyof typeof PHYSICAL_UNIT_NAMES_TEMPERATURE][]

export type TemperatureUnitName = typeof PHYSICAL_UNIT_NAMES_TEMPERATURE[keyof typeof PHYSICAL_UNIT_NAMES_TEMPERATURE]
export type TemperatureUnitId = keyof typeof PHYSICAL_UNIT_NAMES_TEMPERATURE

function createDataMessageUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x01, 0x02],
    extension: {
      measurement: v.object({
        channels: v.array(v.object({
          channelId: v.picklist([
            NETRISF_STRAIN_CHANNEL.channelId,
            NETRISF_DEVICE_TEMPERATURE_CHANNEL.channelId,
            NETRISF_BATTERY_VOLTAGE_CHANNEL.channelId,
          ] as const),
          channelName: v.picklist([
            NETRISF_STRAIN_CHANNEL.name,
            NETRISF_DEVICE_TEMPERATURE_CHANNEL.name,
            NETRISF_BATTERY_VOLTAGE_CHANNEL.name,
          ] as const),
          value: v.number(),
        })),
      }),
    },
  })
}

function createProcessAlarmsDataSchema() {
  return v.array(v.object({
    channelId: v.picklist(Object.keys(PROCESS_ALARM_CHANNEL_NAMES_BY_ID).map(key => Number.parseInt(key, 10)) as (keyof typeof PROCESS_ALARM_CHANNEL_NAMES_BY_ID)[]),
    channelName: v.picklist(Object.values(PROCESS_ALARM_CHANNEL_NAMES_BY_ID) as (typeof PROCESS_ALARM_CHANNEL_NAMES_BY_ID)[keyof typeof PROCESS_ALARM_CHANNEL_NAMES_BY_ID][]),
    event: v.picklist(Object.values(ALARM_EVENTS) as (typeof ALARM_EVENTS)[keyof typeof ALARM_EVENTS][]),
    eventName: v.picklist(Object.keys(ALARM_EVENTS) as (keyof typeof ALARM_EVENTS)[]),
    alarmType: v.picklist(Object.values(PROCESS_ALARM_TYPES) as (typeof PROCESS_ALARM_TYPES)[keyof typeof PROCESS_ALARM_TYPES][]),
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
    alarmType: v.picklist(Object.values(TECHNICAL_ALARM_TYPES) as (typeof TECHNICAL_ALARM_TYPES)[keyof typeof TECHNICAL_ALARM_TYPES][]),
    alarmTypeName: v.picklist(Object.keys(TECHNICAL_ALARM_TYPES) as (keyof typeof TECHNICAL_ALARM_TYPES)[]),
    event: v.picklist(Object.values(ALARM_EVENTS) as (typeof ALARM_EVENTS)[keyof typeof ALARM_EVENTS][]),
    eventName: v.picklist(Object.keys(ALARM_EVENTS) as (keyof typeof ALARM_EVENTS)[]),
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
        event: v.picklist(Object.values(ALARM_EVENTS) as (typeof ALARM_EVENTS)[keyof typeof ALARM_EVENTS][]),
        eventName: v.picklist(Object.keys(ALARM_EVENTS) as (keyof typeof ALARM_EVENTS)[]),
        alarmType: v.picklist(Object.values(DEVICE_ALARM_TYPES) as (typeof DEVICE_ALARM_TYPES)[keyof typeof DEVICE_ALARM_TYPES][]),
        alarmTypeName: v.picklist(Object.keys(DEVICE_ALARM_TYPES) as (keyof typeof DEVICE_ALARM_TYPES)[]),
        causeOfFailure: v.pipe(v.number(), v.minValue(0), v.maxValue(0x7FFF), v.integer()),
        causeOfFailureName: v.picklist(Object.values(DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE) as (typeof DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE)[keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE_NAMES_BY_VALUE][]),
        batteryValue: v.optional(v.number()),
      }),
    },
  })
}

function createDeviceInformationUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x07],
    extension: {
      deviceInformation: v.object({
        productId: v.literal(11),
        productIdName:
          v.literal('NETRIS_F'),
        productSubId: v.literal(0x00),
        productSubIdName:
          v.literal('LoRaWAN'),
        wirelessModuleFirmwareVersion: v.string(),
        wirelessModuleHardwareVersion: v.string(),
        serialNumber: v.string(),
        strainType:
          v.picklist(Object.values(STRAIN_TYPES_BY_ID) as (typeof STRAIN_TYPES_BY_ID)[keyof typeof STRAIN_TYPES_BY_ID][]),
        measurementRangeStartStrain: v.number(),
        measurementRangeEndStrain: v.number(),
        measurementRangeStartDeviceTemperature: v.number(),
        measurementRangeEndDeviceTemperature: v.number(),
        strainUnit: v.picklist(STRAIN_UNIT_ID_LIST),
        strainUnitName: v.picklist(STRAIN_UNIT_NAME_LIST),
        deviceTemperatureUnit: v.picklist(TEMPERATURE_UNIT_ID_LIST),
        deviceTemperatureUnitName: v.picklist(TEMPERATURE_UNIT_NAME_LIST),
      }),
    },
  })
}

function createConfigStatusMainConfigResponseSchema() {
  return v.object({
    commandType: v.literal(0x04 as const),
    commandTypeName: v.literal('get main configuration' as const),
    commandStatus: v.literal(0 as const),
    measurementPeriodNoAlarm: v.pipe(v.number(), v.integer(), v.minValue(0)),
    transmissionMultiplierNoAlarm: v.pipe(v.number(), v.integer(), v.minValue(0)),
    measurementPeriodWithAlarm: v.pipe(v.number(), v.integer(), v.minValue(0)),
    transmissionMultiplierWithAlarm: v.pipe(v.number(), v.integer(), v.minValue(0)),
    bleAdvertisingEnabled: v.boolean(),
  })
}

function createConfigStatusResetBatteryResponseSchema() {
  return v.object({
    commandType: v.literal(0x40 as const),
    commandTypeName: v.literal('reset battery indicator' as const),
    commandStatus: v.picklist([0, 1] as const),
    resetSuccess: v.boolean(),
  })
}

function createConfigStatusProcessAlarmConfigResponseSchema() {
  return v.object({
    commandType: v.picklist([0x50, 0x51] as const),
    commandTypeName: v.picklist([
      'get process alarm configuration strain',
      'get process alarm configuration temperature',
    ] as const),
    commandStatus: v.literal(0 as const),
    channel: v.picklist([0, 1] as const),
    channelName: v.picklist(Object.values(PROCESS_ALARM_CHANNEL_NAMES_BY_ID) as (typeof PROCESS_ALARM_CHANNEL_NAMES_BY_ID)[keyof typeof PROCESS_ALARM_CHANNEL_NAMES_BY_ID][]),
    deadBand: v.number(),
    lowThreshold: v.boolean(),
    lowThresholdValue: v.optional(v.number()),
    highThreshold: v.boolean(),
    highThresholdValue: v.optional(v.number()),
    fallingSlope: v.boolean(),
    fallingSlopeValue: v.optional(v.number()),
    risingSlope: v.boolean(),
    risingSlopeValue: v.optional(v.number()),
    lowThresholdWithDelay: v.boolean(),
    lowThresholdWithDelayValue: v.optional(v.number()),
    lowThresholdWithDelayDelay: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
    highThresholdWithDelay: v.boolean(),
    highThresholdWithDelayValue: v.optional(v.number()),
    highThresholdWithDelayDelay: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  })
}

function createConfigStatusChannelPropertyResponseSchema() {
  return v.object({
    commandType: v.picklist([0x60, 0x61] as const),
    commandTypeName: v.picklist([
      'get channel property configuration strain',
      'get channel property configuration temperature',
    ] as const),
    commandStatus: v.literal(0 as const),
    channel: v.picklist([0, 1] as const),
    channelName: v.picklist(Object.values(PROCESS_ALARM_CHANNEL_NAMES_BY_ID) as (typeof PROCESS_ALARM_CHANNEL_NAMES_BY_ID)[keyof typeof PROCESS_ALARM_CHANNEL_NAMES_BY_ID][]),
    measurementOffset: v.pipe(v.number(), v.integer()),
  })
}

function createConfigurationStatusUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x06 as const],
    extension: {
      configStatus: v.picklist(Object.keys(CONFIG_STATUS_NAMES_BY_VALUE).map(Number) as (keyof typeof CONFIG_STATUS_NAMES_BY_VALUE)[]),
      configStatusName: v.picklist(Object.values(CONFIG_STATUS_NAMES_BY_VALUE) as (typeof CONFIG_STATUS_NAMES_BY_VALUE)[keyof typeof CONFIG_STATUS_NAMES_BY_VALUE][]),
      commandResponse: v.optional(v.union([
        createConfigStatusMainConfigResponseSchema(),
        createConfigStatusResetBatteryResponseSchema(),
        createConfigStatusProcessAlarmConfigResponseSchema(),
        createConfigStatusChannelPropertyResponseSchema(),
      ])),
    },
  })
}

function createDeviceStatisticsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x08],
    extension: {
      deviceStatistic: v.object({
        batteryLevelNewEvent: v.boolean(),
        batteryLevelPercent: v.pipe(v.number(), v.minValue(0), v.maxValue(0x7F), v.integer()),
      }),
    },
  })
}

export function createNetrisFTULIP2UplinkOutputSchema() {
  return v.union([
    createDataMessageUplinkOutputSchema(),
    createProcessAlarmsUplinkOutputSchema(),
    createTechnicalAlarmsUplinkOutputSchema(),
    createDeviceAlarmsUplinkOutputSchema(),
    createConfigurationStatusUplinkOutputSchema(),
    createDeviceInformationUplinkOutputSchema(),
    createDeviceStatisticsUplinkOutputSchema(),
  ])
}

export type NetrisFTULIP2DataMessageUplinkOutput = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>
export type NetrisFTULIP2ProcessAlarmsData = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>['data']['processAlarms']
export type NetrisFTULIP2ProcessAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>
export type NetrisFTULIP2TechnicalAlarmsData = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>['data']['technicalAlarms']
export type NetrisFTULIP2TechnicalAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>
export type NetrisFTULIP2DeviceAlarmsData = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>['data']['deviceAlarm']
export type NetrisFTULIP2DeviceAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>
export type NetrisFTULIP2DeviceInformationUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>
export type NetrisFTULIP2ConfigurationStatusUplinkOutput = v.InferOutput<ReturnType<typeof createConfigurationStatusUplinkOutputSchema>>
export type NetrisFTULIP2DeviceStatisticsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>
