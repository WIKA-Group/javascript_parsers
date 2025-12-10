import type { TULIP3DeviceConfig } from '../../codecs/tulip3/profile'
/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createGenericUplinkOutputSchema } from './_shared'
import { createFullSensorChannelSchemaWithExtension } from './index'

// =============================================================================
// BASE TYPE SCHEMAS
// =============================================================================

// =============================================================================
// MEASUREMENT SCHEMAS
// =============================================================================

// Helper type to extract measurement types from a channel config

/**
 * Creates a validation schema for general measurements.
 * This is a union type that can be either an error measurement or a value measurement.
 * The schema enforces that sensor and channel combinations are valid according to the device configuration.
 *
 * @param config - Configuration object defining sensor-to-channel mappings
 * @returns A Valibot union schema for general measurements with custom validation
 * @template TTULIP3DeviceConfig - Type-safe sensor configuration
 * @example
 * ```typescript
 * const config = {
 *   sensor1: { channel1: {}, channel2: {} },
 *   sensor2: { channel1: {} }
 * }
 * const schema = createGeneralMeasurementSchema(config)
 *
 * // Valid error measurement
 * const errorResult = v.parse(schema, {
 *   sensorId: 0, // sensor1
 *   channelId: 0, // channel1
 *   sourceDataType: "float - IEEE754",
 *   valueAcquisitionError: true
 * })
 *
 * // Valid value measurement
 * const valueResult = v.parse(schema, {
 *   sensorId: 1, // sensor2
 *   channelId: 0, // channel1
 *   sourceDataType: "float - IEEE754",
 *   valueAcquisitionError: false,
 *   value: 42.0
 * })
 * ```
 */
function createGeneralMeasurementSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  return v.pipe(
    v.union([
      // error measurement schema
      ...createFullSensorChannelSchemaWithExtension(config, {
        valueAcquisitionError: v.literal(true),
        value: v.optional(v.undefined()),
      }),
      ...createFullSensorChannelSchemaWithExtension(config, {
        valueAcquisitionError: v.literal(false),
        value: v.number(),
      }),
    ]),
  )
}

// =============================================================================
// DATA MESSAGE SCHEMAS
// =============================================================================

/**
 * Creates a validation schema for data message uplink output.
 * This is the main schema for TULIP3 data messages, including optional warnings.
 *
 * @param config - Configuration object defining sensor-to-channel mappings
 * @returns A Valibot object schema for data message uplink output
 * @template TTULIP3DeviceConfig - Type-safe sensor configuration
 * @example
 * ```typescript
 * const config = {
 *   sensor1: {
 *     channel1: {
 *       min: 0,
 *       max: 100,
 *       unit: "°C",
 *       measurementTypes: ["float - IEEE754"]
 *     }
 *   }
 * }
 * const schema = createDataMessageUplinkOutputSchema(config)
 *
 * const result = v.parse(schema, {
 *   data: {
 *     messageType: 0x10,
 *     messageSubType: 0x01,
 *     measurements: [
 *       {
 *         sensorId: 0,
 *         channelId: 0,
 *         channelName: "temperature",
 *         sourceDataType: "float - IEEE754",
 *         valueAcquisitionError: false,
 *         value: 23.5
 *       }
 *     ]
 *   },
 *   warnings: ["Optional warning message"]
 * })
 * ```
 */
function createDataMessageUplinkOutputSchema<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(config: TTULIP3DeviceConfig) {
  return createGenericUplinkOutputSchema({
    messageType: [0x10, 0x11], // Data message types
    messageSubType: [0x01], // Data message subtype
    extension: {
      measurements: v.tupleWithRest([createGeneralMeasurementSchema(config)], createGeneralMeasurementSchema(config)),
    },
  })
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type GeneralMeasurement<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<ReturnType<typeof createGeneralMeasurementSchema<TTULIP3DeviceConfig>>>
export type DataMessageData<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = DataMessageUplinkOutput<TTULIP3DeviceConfig>['data']['measurements']
export type DataMessageUplinkOutput<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = v.InferOutput<ReturnType<typeof createDataMessageUplinkOutputSchema<TTULIP3DeviceConfig>>>

export {
  createDataMessageUplinkOutputSchema,
}
