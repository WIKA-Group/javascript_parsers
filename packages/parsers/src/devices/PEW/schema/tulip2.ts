/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createSemVerSchema } from '../../../schemas'
import { createConfigurationIdSchema } from '../../../schemas/tulip2/downlink'
import { createUplinkOutputSchemaFactory } from '../../../schemas/tulip2/uplink'
import { ALARM_EVENTS, DEVICE_ALARM_CAUSE_OF_FAILURE, DEVICE_ALARM_TYPES, MEASUREMENT_CHANNELS, PRESSURE_TYPES, PRESSURE_UNITS, PROCESS_ALARM_CHANNEL_NAMES, PROCESS_ALARM_TYPES, TECHNICAL_ALARM_TYPES } from '../parser/tulip2/lookups'

const createUplinkSchema = createUplinkOutputSchemaFactory(31)

function createChannelMeasurement<TName extends keyof typeof MEASUREMENT_CHANNELS>(name: TName) {
  return v.object({
    channelName: v.literal(name),
    channelId: v.literal(MEASUREMENT_CHANNELS[name]),
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

type ProcessAlarmsPossibility = {
  // first go through the 2 channels
  [Channel in keyof typeof PROCESS_ALARM_CHANNEL_NAMES]: {
    // go through if its disappeared or not
    [AlarmEvent in keyof typeof ALARM_EVENTS]: {
      [AlarmType in keyof typeof PROCESS_ALARM_TYPES]: v.ObjectSchema<{
        channelId: v.LiteralSchema<typeof PROCESS_ALARM_CHANNEL_NAMES[Channel], undefined>
        channelName: v.LiteralSchema<Channel, undefined>
        event: v.LiteralSchema<typeof ALARM_EVENTS[AlarmEvent], undefined>
        eventName: v.LiteralSchema<AlarmEvent, undefined>
        alarmType: v.LiteralSchema<typeof PROCESS_ALARM_TYPES[AlarmType], undefined>
        alarmTypeName: v.LiteralSchema<AlarmType, undefined>
        value: v.NumberSchema<undefined>
      }, undefined>
    }[keyof typeof PROCESS_ALARM_TYPES]
  }[keyof typeof ALARM_EVENTS]
}[keyof typeof PROCESS_ALARM_CHANNEL_NAMES]

function createProcessAlarmsDataSchema() {
  // so here it be for channel0 or 1, with event 0 or 1 and what alarm type 0-7 which must be or together

  const pos: ProcessAlarmsPossibility[] = []
  // now go through all of the 3 objects and combine them with
  Object.keys(PROCESS_ALARM_CHANNEL_NAMES).forEach((channelName) => {
    Object.keys(ALARM_EVENTS).forEach((eventName) => {
      Object.keys(PROCESS_ALARM_TYPES).forEach((alarmTypeName) => {
        pos.push(v.object({
          channelId: v.literal(PROCESS_ALARM_CHANNEL_NAMES[channelName as keyof typeof PROCESS_ALARM_CHANNEL_NAMES]),
          channelName: v.literal(channelName),
          event: v.literal(ALARM_EVENTS[eventName as keyof typeof ALARM_EVENTS]),
          eventName: v.literal(eventName),
          alarmType: v.literal(PROCESS_ALARM_TYPES[alarmTypeName as keyof typeof PROCESS_ALARM_TYPES]),
          alarmTypeName: v.literal(alarmTypeName),
          value: v.number(),
        }) as ProcessAlarmsPossibility)
      })
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

type TechnicalAlarmsPossibility = {
  [AlarmEvent in keyof typeof ALARM_EVENTS]: v.ObjectSchema<{
    event: v.LiteralSchema<typeof ALARM_EVENTS[AlarmEvent], undefined>
    eventName: v.LiteralSchema<AlarmEvent, undefined>
    alarmType: v.NumberSchema<undefined>
    alarmTypeNames: v.ArraySchema<v.PicklistSchema<(keyof typeof TECHNICAL_ALARM_TYPES)[], undefined>, undefined>
  }, undefined>
}[keyof typeof ALARM_EVENTS]

function createTechnicalAlarmsDataSchema() {
  const pos: TechnicalAlarmsPossibility[] = []
  Object.keys(ALARM_EVENTS).forEach((eventName) => {
    pos.push(v.object({
      event: v.literal(ALARM_EVENTS[eventName as keyof typeof ALARM_EVENTS]),
      eventName: v.literal(eventName),
      alarmType: v.pipe(v.number(), v.minValue(0), v.maxValue(255), v.integer()),
      alarmTypeNames: v.array(v.picklist(Object.keys(TECHNICAL_ALARM_TYPES))),
    }) as TechnicalAlarmsPossibility)
  })
  return v.tuple([v.union(pos)])
}

function createTechnicalAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x04],
    extension: {
      technicalAlarms: createTechnicalAlarmsDataSchema(),
    },
  })
}

type DeviceAlarmsPossibility = {
  [AlarmEvent in keyof typeof ALARM_EVENTS]: {
    [AlarmType in keyof typeof DEVICE_ALARM_TYPES]: {
      [CauseOfFailure in keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE]: v.ObjectSchema<{
        event: v.LiteralSchema<typeof ALARM_EVENTS[AlarmEvent], undefined>
        eventName: v.LiteralSchema<AlarmEvent, undefined>
        alarmType: v.LiteralSchema<typeof DEVICE_ALARM_TYPES[AlarmType], undefined>
        alarmTypeName: v.LiteralSchema<AlarmType, undefined>
        causeOfFailure: v.LiteralSchema<typeof DEVICE_ALARM_CAUSE_OF_FAILURE[CauseOfFailure], undefined>
        causeOfFailureName: v.LiteralSchema<CauseOfFailure, undefined>
      }
        // value is only present if the alarm "battery low" is sent
      & (AlarmType extends 'battery low' ? {
        value: v.NumberSchema<undefined>
      } : {
        value: v.OptionalSchema<v.UndefinedSchema<undefined>, undefined>
      }), undefined>
    }[keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE]
  }[keyof typeof DEVICE_ALARM_TYPES]
}[keyof typeof ALARM_EVENTS]

function createDeviceAlarmsDataSchema() {
  const pos: DeviceAlarmsPossibility[] = []
  Object.keys(ALARM_EVENTS).forEach((eventName) => {
    Object.keys(DEVICE_ALARM_TYPES).forEach((alarmTypeName) => {
      Object.keys(DEVICE_ALARM_CAUSE_OF_FAILURE).forEach((causeOfFailureName) => {
        if (alarmTypeName === 'battery low') {
          // value only present if battery low
          pos.push(
            v.object({
              event: v.literal(ALARM_EVENTS[eventName as keyof typeof ALARM_EVENTS]),
              eventName: v.literal(eventName),
              alarmType: v.literal(DEVICE_ALARM_TYPES[alarmTypeName as keyof typeof DEVICE_ALARM_TYPES]),
              alarmTypeName: v.literal(alarmTypeName),
              causeOfFailure: v.literal(DEVICE_ALARM_CAUSE_OF_FAILURE[causeOfFailureName as keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE]),
              causeOfFailureName: v.literal(causeOfFailureName),
              value: v.number(),
            }) as DeviceAlarmsPossibility,
          )
        }
        else {
          pos.push(
            v.object({
              event: v.literal(ALARM_EVENTS[eventName as keyof typeof ALARM_EVENTS]),
              eventName: v.literal(eventName),
              alarmType: v.literal(DEVICE_ALARM_TYPES[alarmTypeName as keyof typeof DEVICE_ALARM_TYPES]),
              alarmTypeName: v.literal(alarmTypeName),
              causeOfFailure: v.literal(DEVICE_ALARM_CAUSE_OF_FAILURE[causeOfFailureName as keyof typeof DEVICE_ALARM_CAUSE_OF_FAILURE]),
              causeOfFailureName: v.literal(causeOfFailureName),
            }) as DeviceAlarmsPossibility,
          )
        }
      })
    })
  })
  return v.union(pos)
}

function createDeviceAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x05],
    extension: {
      deviceAlarm: createDeviceAlarmsDataSchema(),
    },
  })
}

type DeviceInformationPossibility = {
  [PressureType in keyof typeof PRESSURE_TYPES]: {
    [PressureUnit in keyof typeof PRESSURE_UNITS]: v.ObjectSchema<{
      productIdName: v.LiteralSchema<'PEW', undefined>
      productId: v.LiteralSchema<11, undefined>
      productSubId: v.LiteralSchema<0, undefined>
      productSubIdName: v.LiteralSchema<'LoRaWAN', undefined>
      wirelessModuleFirmwareVersion: ReturnType<typeof createSemVerSchema>
      wirelessModuleHardwareVersion: ReturnType<typeof createSemVerSchema>
      serialNumber: v.StringSchema<undefined>
      pressureType: v.LiteralSchema<typeof PRESSURE_TYPES[PressureType], undefined>
      measurementRangeStartPressure: v.NumberSchema<undefined>
      measurementRangeEndPressure: v.NumberSchema<undefined>
      measurementRangeStartDeviceTemperature: v.NumberSchema<undefined>
      measurementRangeEndDeviceTemperature: v.NumberSchema<undefined>
      pressureUnit: v.LiteralSchema<typeof PRESSURE_UNITS[PressureUnit], undefined>
      pressureUnitName: v.LiteralSchema<PressureUnit, undefined>
      deviceTemperatureUnit: v.LiteralSchema<32, undefined>
      deviceTemperatureUnitName: v.LiteralSchema<'Celsius', undefined>
    }, undefined>
  }[keyof typeof PRESSURE_UNITS]
}[keyof typeof PRESSURE_TYPES]
// if there are only 8 byte present in the message then there was communication error so only a few things are present
| v.ObjectSchema<{
  productIdName: v.LiteralSchema<'PEW', undefined>
  productId: v.LiteralSchema<11, undefined>
  productSubId: v.LiteralSchema<0, undefined>
  productSubIdName: v.LiteralSchema<'LoRaWAN', undefined>
  wirelessModuleFirmwareVersion: ReturnType<typeof createSemVerSchema>
  wirelessModuleHardwareVersion: ReturnType<typeof createSemVerSchema>
}, undefined>

function createDeviceInformationDataSchema() {
  const pos: DeviceInformationPossibility[] = []
  Object.keys(PRESSURE_TYPES).forEach((pressureTypeName) => {
    Object.keys(PRESSURE_UNITS).forEach((pressureUnitName) => {
      pos.push(v.object({
        productIdName: v.literal('PEW'),
        productId: v.literal(11),
        productSubId: v.literal(0),
        productSubIdName: v.literal('LoRaWAN'),
        wirelessModuleFirmwareVersion: createSemVerSchema(),
        wirelessModuleHardwareVersion: createSemVerSchema(),
        serialNumber: v.string(),
        pressureType: v.literal(PRESSURE_TYPES[pressureTypeName as keyof typeof PRESSURE_TYPES]),
        measurementRangeStartPressure: v.number(),
        measurementRangeEndPressure: v.number(),
        measurementRangeStartDeviceTemperature: v.number(),
        measurementRangeEndDeviceTemperature: v.number(),
        pressureUnit: v.literal(PRESSURE_UNITS[pressureUnitName as keyof typeof PRESSURE_UNITS]),
        pressureUnitName: v.literal(pressureUnitName),
        deviceTemperatureUnit: v.literal(32),
        deviceTemperatureUnitName: v.literal('°C'),
      }) as any as DeviceInformationPossibility)
    })
  })
  return v.union([...pos,
    // Schema for when only 8 bytes are present
    v.object({
      productIdName: v.literal('PEW'),
      productId: v.literal(11),
      productSubId: v.literal(0),
      productSubIdName: v.literal('LoRaWAN'),
      wirelessModuleFirmwareVersion: createSemVerSchema(),
      wirelessModuleHardwareVersion: createSemVerSchema(),
    })])
}

function createDeviceInformationUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x07],
    extension: {
      deviceInformation: createDeviceInformationDataSchema(),
    },
  })
}

function createDeviceStatisticsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x08],
    extension: {
      deviceStatistic: v.object({
        batteryLevelNewEvent: v.boolean(),
        batteryLevelPercent: v.union([v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.integer()), v.literal(0x7F)]),
      }),
    },
  })
}

export function createPEWTULIP2UplinkOutputSchema() {
  return v.union([
    createDataMessageUplinkOutputSchema(),
    createProcessAlarmsUplinkOutputSchema(),
    createTechnicalAlarmsUplinkOutputSchema(),
    createDeviceAlarmsUplinkOutputSchema(),
    createDeviceInformationUplinkOutputSchema(),
    createDeviceStatisticsUplinkOutputSchema(),
  ])
}

// go through each message type and create the Data type and the uplinkOutput type
export type PEWTULIP2DataMessageData = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>['data']['measurement']
export type PEWTULIP2DataMessageUplinkOutput = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>

export type PEWTULIP2ProcessAlarmsData = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>['data']['processAlarms']
export type PEWTULIP2ProcessAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>

export type PEWTULIP2TechnicalAlarmsData = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>['data']['technicalAlarms']
export type PEWTULIP2TechnicalAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createTechnicalAlarmsUplinkOutputSchema>>

export type PEWTULIP2DeviceAlarmsData = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>['data']['deviceAlarm']
export type PEWTULIP2DeviceAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>

export type PEWTULIP2DeviceInformationData = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>['data']['deviceInformation']
export type PEWTULIP2DeviceInformationUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceInformationUplinkOutputSchema>>

export type PEWTULIP2DeviceStatisticsData = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>['data']['deviceStatistic']
export type PEWTULIP2DeviceStatisticsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>

// Downlink extras (kept in schema layer, not parser constants)
export function createPEWTULIP2DropConfigurationSchema() {
  return v.object({
    deviceAction: v.literal('dropConfiguration'),
    configurationId: createConfigurationIdSchema(127),
  })
}

function getConfigurationChannelSchema() {
  return v.optional(
    v.union([
      v.literal(true),
      v.object({
        alarms: v.optional(v.literal(true)),
        measureOffset: v.optional(v.literal(true)),
      }),
    ]),
  )
}

export function createPEWTULIP2GetConfigurationSchema() {
  return v.object({
    deviceAction: v.literal('getConfiguration'),
    mainConfiguration: v.optional(v.literal(true)),
    channel0: getConfigurationChannelSchema(),
    channel1: getConfigurationChannelSchema(),
  })
}

export type PEWTULIP2DownlinkExtraInput
  = | v.InferOutput<ReturnType<typeof createPEWTULIP2DropConfigurationSchema>>
    | v.InferOutput<ReturnType<typeof createPEWTULIP2GetConfigurationSchema>>
