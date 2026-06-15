/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createSemVerSchema } from '..'
import { CONFIGURATION_BASE_STATUS_TYPES } from '../../lookups'

const createUplinkSchema = createUplinkOutputSchemaFactory(31)

function createGenericUplinkOutputSchema<const TMaxConfigId extends number, const TType extends [number, ...number[]], const TObjectExtension extends v.ObjectEntries>(i: {
  messageType: TType
  maxConfigId: TMaxConfigId
  extension: TObjectExtension
}) {
  return v.object({
    data: v.object({
      configurationId: v.pipe(
        v.number(),
        v.minValue(0),
        v.maxValue(i.maxConfigId),
        v.integer(),
      ),
      messageType: v.picklist(i.messageType),
      ...i.extension,
    }),
    warnings: v.optional(v.array(v.string())),
  })
}

export function createUplinkOutputSchemaFactory<const TMaxConfigId extends number>(
  maxConfigId: TMaxConfigId,
) {
  return <const TType extends [number, ...number[]], const TObjectExtension extends v.ObjectEntries>(i: {
    messageType: TType
    extension: TObjectExtension
  }) => {
    return createGenericUplinkOutputSchema({
      messageType: i.messageType,
      maxConfigId,
      extension: i.extension,
    })
  }
}

export function createOutputFailureSchema() {
  return v.object({
    /**
     * A list of error messages while decoding the provided payload.
     */
    errors: v.array(v.string()),
  })
}

export function createDownlinkOutputSuccessfulSchema() {
  return v.object({
    warnings: v.optional(v.array(v.string())),
    /**
     * The uplink payload byte array, where each byte is represented by an integer between 0 and 255.
     */
    bytes: v.array(
      v.pipe(
        v.number(),
        v.minValue(0),
        v.maxValue(255),
        v.integer(),
      ),
    ),
    /**
     * The uplink message LoRaWAN `fPort`
     */
    fPort: v.pipe(v.number(), v.minValue(1), v.maxValue(224), v.integer()),
  })
}

export function createChannelMeasurementSchema() {
  return v.object({
    channelId: v.pipe(
      v.number(),
      v.minValue(0),
      v.integer(),
    ),
    value: v.number(),
    channelName: v.string(),
  })
}

export function createProcessAlarmsSchemaExtension() {
  return {
    processAlarms: v.array(
      v.object({
        channelId: v.pipe(
          v.number(),
          v.minValue(0),
          v.integer(),
        ),
        channelName: v.string(),
        event: v.picklist([0, 1]),
        eventName: v.picklist(['triggered', 'disappeared']),
        alarmType: v.picklist([0, 1, 2, 3, 4, 5]),
        alarmTypeName: v.picklist([
          'low threshold',
          'high threshold',
          'falling slope',
          'rising slope',
          'low threshold with delay',
          'high threshold with delay',
        ]),
        value: v.number(),
      }),
    ),
  }
}

export function createTechnicalAlarmsSchemaExtension() {
  return {
    technicalAlarms: v.array(
      v.object({
        channelId: v.pipe(
          v.number(),
          v.minValue(0),
          v.integer(),
        ),
        channelName: v.string(),
        event: v.picklist([0, 1]),
        eventName: v.picklist(['triggered', 'disappeared']),
        causeOfFailure: v.picklist([0, 1, 2, 3, 4, 5]),
        causeOfFailureName: v.picklist([
          'no alarm',
          'open condition',
          'short condition',
          'saturated low',
          'saturated high',
          'ADC communication error',
        ]),
      }),
    ),
  }
}

export function createConfigurationStatusSchemaExtension() {
  return {
    configurationStatus: v.object({
      status: v.picklist([
        'configuration successful',
        'configuration rejected',
        'command successful',
        'command failed',
      ]),
      statusId: v.picklist([
        0x20,
        0x30,
        0x60,
        0x70,
      ]),
    }),
  }
}

export function createRadioUnitIdentificationSchemaExtension() {
  return {
    radioUnitIdentification: v.object({
      productId: v.pipe(v.number(), v.integer()),
      productSubId: v.pipe(v.number(), v.integer()),
      radioUnitModemFirmwareVersion: createSemVerSchema(),
      radioUnitModemHardwareVersion: createSemVerSchema(),
      radioUnitFirmwareVersion: createSemVerSchema(),
      radioUnitHardwareVersion: createSemVerSchema(),
      serialNumber: v.string(),
    }),
  }
}

export function createDeviceStatisticSchemaExtension() {
  return {
    deviceStatistic: v.object({
      numberOfMeasurements: v.pipe(v.number(), v.minValue(0), v.integer()),
      numberOfTransmissions: v.pipe(v.number(), v.minValue(0), v.integer()),
      batteryResetSinceLastKeepAlive: v.boolean(),
      estimatedBatteryPercent: v.pipe(v.number(), v.minValue(0), v.maxValue(100)),
      batteryCalculationError: v.boolean(),
      radioUnitTemperatureLevel_C: v.number(),
    }),
  }
}

function createBase(CONFIGURATION_STATUS_VALUES: number [], CONFIGURATION_STATUS_DESCRIPTIONS: string[]) {
  return v.object({
    status: v.picklist(CONFIGURATION_STATUS_VALUES),
    statusDescription: v.picklist(CONFIGURATION_STATUS_DESCRIPTIONS),
  })
}

export function createConfigurationStatusSchema<const TSchemas extends v.ObjectSchema<v.ObjectEntries, undefined>[]>(configurationStatusValues: number [], configurationStatusDescriptions: string[], ...objectSchema: TSchemas) {
  return v.union([v.intersect([
    createBase(configurationStatusValues, configurationStatusDescriptions),
    v.union(objectSchema),
  ]), createBase(configurationStatusValues, configurationStatusDescriptions)])
}

// Configuration status (0x06)
export function createConfigurationStatusUplinkOutputSchema() {
  return createUplinkSchema({
    messageType: [0x06],
    extension: {
      configurationStatus: createConfigurationStatusSchema(Object.keys(CONFIGURATION_BASE_STATUS_TYPES).map(key => Number.parseInt(key, 10)), Object.values(CONFIGURATION_BASE_STATUS_TYPES), createConfigStatusMainConfigResponseSchema(), createConfigStatusResetBatteryResponseSchema(), createConfigStatusProcessAlarmConfigResponseSchema()),
    },
  })
}

// Configuration status (0x06) — command response sub-schemas
function createConfigStatusMainConfigResponseSchema() {
  return v.object({
    commandType: v.literal(0x04 as const),
    commandTypeName: v.literal('get main configuration' as const),
    measurementPeriodNoAlarm: v.pipe(v.number(), v.integer(), v.minValue(0)),
    transmissionMultiplierNoAlarm: v.pipe(v.number(), v.integer(), v.minValue(0)),
    measurementPeriodWithAlarm: v.pipe(v.number(), v.integer(), v.minValue(0)),
    transmissionMultiplierWithAlarm: v.pipe(v.number(), v.integer(), v.minValue(0)),
  })
}

function createConfigStatusResetBatteryResponseSchema() {
  return v.object({
    commandType: v.literal(0x05 as const),
    commandTypeName: v.literal('reset battery indicator' as const),
  })
}

function createConfigStatusProcessAlarmConfigResponseSchema() {
  return v.object({
    commandType: v.literal(0x40 as const),
    commandTypeName: v.literal('get process alarm configuration' as const),
    channel: v.literal(0 as const),
    channelName: v.literal('measurement' as const),
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
