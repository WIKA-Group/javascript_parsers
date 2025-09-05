/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createSemVerSchema } from '..'

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
