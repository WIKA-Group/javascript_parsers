/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputSchemaFactory } from '../../../schemas/tulip2/uplink'
import {
  ALARM_EVENTS,
  CONFIGURATION_STATUS_BY_ID,
  DEVICE_ALARM_VALID_BITS,
  DEVICE_ALARMS_BY_ID,
  MEASURANDS_BY_ID,
  PROCESS_ALARM_TYPES,
  SENSOR_TECHNICAL_ALARM_VALID_BITS,
  SENSOR_TECHNICAL_ALARMS_BY_ID,
  UNITS_BY_ID,
} from '../parser/tulip2/lookups'

const createUplinkSchema = createUplinkOutputSchemaFactory(255)

const CHANNEL_IDS = [0, 1, 2, 3, 4, 5] as const
const PROCESS_ALARM_TYPE_VALUES = Object.values(PROCESS_ALARM_TYPES)
const PROCESS_ALARM_TYPE_NAMES = Object.keys(PROCESS_ALARM_TYPES) as (keyof typeof PROCESS_ALARM_TYPES)[]
const ALARM_EVENT_VALUES = Object.values(ALARM_EVENTS)
const ALARM_EVENT_NAMES = Object.keys(ALARM_EVENTS) as (keyof typeof ALARM_EVENTS)[]
const SENSOR_ALARM_TYPE_VALUES = SENSOR_TECHNICAL_ALARM_VALID_BITS
const SENSOR_ALARM_DESCRIPTIONS = Object.values(SENSOR_TECHNICAL_ALARMS_BY_ID) as string[]
const DEVICE_ALARM_VALUES = DEVICE_ALARM_VALID_BITS
const DEVICE_ALARM_DESCRIPTIONS = Object.values(DEVICE_ALARMS_BY_ID) as string[]
const CONFIGURATION_STATUS_VALUES = Object.keys(CONFIGURATION_STATUS_BY_ID).map(Number)
const CONFIGURATION_STATUS_DESCRIPTIONS = Object.values(CONFIGURATION_STATUS_BY_ID)
const MEASURAND_VALUES = Object.values(MEASURANDS_BY_ID) as string[]
const UNIT_VALUES = Object.values(UNITS_BY_ID) as string[]

function createMeasurementsSchema() {
  return v.object({
    channels: v.array(
      v.object({
        channelId: v.picklist(CHANNEL_IDS),
        value: v.number(),
      }),
    ),
  })
}

function createProcessAlarmsSchema() {
  return v.array(
    v.object({
      channelId: v.picklist(CHANNEL_IDS),
      alarmType: v.picklist(PROCESS_ALARM_TYPE_VALUES),
      alarmTypeName: v.picklist(PROCESS_ALARM_TYPE_NAMES),
      event: v.picklist(ALARM_EVENT_VALUES),
      eventName: v.picklist(ALARM_EVENT_NAMES),
      value: v.number(),
    }),
  )
}

function createSensorTechnicalAlarmsSchema() {
  return v.array(
    v.object({
      channelId: v.picklist(CHANNEL_IDS),
      alarmType: v.picklist(SENSOR_ALARM_TYPE_VALUES),
      alarmDescription: v.picklist(SENSOR_ALARM_DESCRIPTIONS),
    }),
  )
}

function createDeviceAlarmsSchema() {
  return v.array(
    v.object({
      alarmType: v.picklist(DEVICE_ALARM_VALUES),
      alarmDescription: v.picklist(DEVICE_ALARM_DESCRIPTIONS),
    }),
  )
}

function createMainConfigurationSchema() {
  return v.object({
    acquisitionTimeAlarmsOff: v.union([v.literal('unauthorized'), v.number()]),
    publicationTimeFactorAlarmsOff: v.union([v.literal('unauthorized'), v.number()]),
    acquisitionTimeAlarmsOn: v.union([v.literal('unauthorized'), v.number()]),
    publicationTimeFactorAlarmsOn: v.union([v.literal('unauthorized'), v.number()]),
  })
}

function createChannelConfigurationSchema() {
  return v.object({
    sensorOrChannelId: v.pipe(v.number(), v.minValue(0), v.maxValue(5), v.integer()),
    deadBand: v.pipe(v.number(), v.minValue(0), v.integer()),
    alarm1Threshold: v.optional(v.number()),
    alarm2Threshold: v.optional(v.number()),
    alarm3Slope: v.optional(v.number()),
    alarm4Slope: v.optional(v.number()),
    alarm5Threshold: v.optional(v.number()),
    alarm5Period: v.optional(v.number()),
    alarm6Threshold: v.optional(v.number()),
    alarm6Period: v.optional(v.number()),
  })
}

function createConfigurationStatusSchema() {
  return v.union([
    v.object({
      status: v.picklist(CONFIGURATION_STATUS_VALUES),
      statusDescription: v.picklist(CONFIGURATION_STATUS_DESCRIPTIONS),
      commandType: v.literal(0x04),
      mainConfiguration: createMainConfigurationSchema(),
    }),
    v.object({
      status: v.picklist(CONFIGURATION_STATUS_VALUES),
      statusDescription: v.picklist(CONFIGURATION_STATUS_DESCRIPTIONS),
      commandType: v.pipe(v.number(), v.minValue(0), v.maxValue(255), v.integer()),
      channelConfiguration: createChannelConfigurationSchema(),
    }),
  ])
}

function createGasMixturesSchema() {
  return v.object({
    SF6: v.number(),
    N2: v.number(),
    CF4: v.number(),
    O2: v.number(),
    C02: v.number(),
    Novec4710: v.number(),
    He: v.number(),
    Ar: v.number(),
  })
}

function createChannelIdentificationSchema() {
  return v.object({
    measurand: v.picklist(MEASURAND_VALUES),
    unit: v.picklist(UNIT_VALUES),
  })
}

function createDeviceIdentificationSchema() {
  return v.object({
    productId: v.literal(0x15),
    productSubId: v.literal(0x40),
    wirelessModuleFirmwareVersion: v.string(),
    wirelessModuleHardwareVersion: v.string(),
    serialNumber: v.string(),
    channels: v.object({
      channel0: createChannelIdentificationSchema(),
      channel1: createChannelIdentificationSchema(),
      channel2: createChannelIdentificationSchema(),
      channel3: createChannelIdentificationSchema(),
      channel4: createChannelIdentificationSchema(),
      channel5: createChannelIdentificationSchema(),
    }),
    gasMixtures: createGasMixturesSchema(),
  })
}

function createBatteryLevelIndicatorSchema() {
  return v.object({
    restartedSinceLastKeepAlive: v.boolean(),
    batteryLevelPercent: v.number(),
    batteryLevelCalculationError: v.boolean(),
    batteryPresent: v.boolean(),
  })
}

function createChannelRangeSchema() {
  return v.object({
    min: v.number(),
    max: v.number(),
  })
}

function createChannelRangesSchema() {
  return v.object({
    channel0: createChannelRangeSchema(),
    channel1: createChannelRangeSchema(),
    channel2: createChannelRangeSchema(),
    channel3: createChannelRangeSchema(),
    channel4: createChannelRangeSchema(),
    channel5: createChannelRangeSchema(),
  })
}

function createDataMessageUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x01, 0x02],
    extension: {
      measurements: createMeasurementsSchema(),
    },
  })
}

function createProcessAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x03],
    extension: {
      processAlarms: createProcessAlarmsSchema(),
    },
  })
}

function createSensorTechnicalAlarmsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x04],
    extension: {
      sensorTechnicalAlarms: createSensorTechnicalAlarmsSchema(),
    },
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

function createConfigurationStatusUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x06],
    extension: {
      configurationStatus: createConfigurationStatusSchema(),
    },
  })
}

function createDeviceIdentificationUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x07],
    extension: {
      deviceIdentification: createDeviceIdentificationSchema(),
    },
  })
}

function createDeviceStatisticsUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x08],
    extension: {
      batteryLevelIndicator: createBatteryLevelIndicatorSchema(),
    },
  })
}

function createExtendedDeviceIdentificationUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x09],
    extension: {
      channelRanges: createChannelRangesSchema(),
    },
  })
}

export function createGD20WTULIP2UplinkOutputSchema() {
  return v.union([
    createDataMessageUplinkOutputSchema(),
    createProcessAlarmsUplinkOutputSchema(),
    createSensorTechnicalAlarmsUplinkOutputSchema(),
    createDeviceAlarmsUplinkOutputSchema(),
    createConfigurationStatusUplinkOutputSchema(),
    createDeviceIdentificationUplinkOutputSchema(),
    createDeviceStatisticsUplinkOutputSchema(),
    createExtendedDeviceIdentificationUplinkOutputSchema(),
  ])
}

export type GD20WTULIP2DataMessageUplinkOutput = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema>>
export type GD20WTULIP2ProcessAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createProcessAlarmsUplinkOutputSchema>>
export type GD20WTULIP2SensorTechnicalAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createSensorTechnicalAlarmsUplinkOutputSchema>>
export type GD20WTULIP2DeviceAlarmsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceAlarmsUplinkOutputSchema>>
export type GD20WTULIP2ConfigurationStatusUplinkOutput = v.InferOutput<ReturnType<typeof createConfigurationStatusUplinkOutputSchema>>
export type GD20WTULIP2DeviceIdentificationUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceIdentificationUplinkOutputSchema>>
export type GD20WTULIP2DeviceStatisticsUplinkOutput = v.InferOutput<ReturnType<typeof createDeviceStatisticsUplinkOutputSchema>>
export type GD20WTULIP2ExtendedDeviceIdentificationUplinkOutput = v.InferOutput<ReturnType<typeof createExtendedDeviceIdentificationUplinkOutputSchema>>

export type GD20WTULIP2MainConfigurationData = v.InferOutput<ReturnType<typeof createMainConfigurationSchema>>
export type GD20WTULIP2ChannelConfigurationData = v.InferOutput<ReturnType<typeof createChannelConfigurationSchema>>
