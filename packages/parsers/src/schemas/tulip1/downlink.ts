/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'

export function createDownlinkOutputSchemaFactory<const TMaxConfigId extends number>(
  maxConfigId: TMaxConfigId,
) {
  return <const TAction extends string, const TObjectConfiguration extends v.ObjectEntries>(i: {
    deviceAction: TAction
    configuration: TObjectConfiguration
  }) => {
    return createBaseDownlinkInputSchema({
      maxConfigId,
      deviceAction: i.deviceAction,
      configuration: i.configuration,
    })
  }
}

function createBaseDownlinkInputSchema<const TMaxConfigId extends number, const TAction extends string, const TObjectConfiguration extends v.ObjectEntries>(i: {
  maxConfigId: TMaxConfigId
  deviceAction: TAction
  configuration: TObjectConfiguration
}) {
  return v.object({
    configurationId: v.optional(
      v.pipe(
        v.number(),
        v.integer(),
        v.minValue(0),
        v.maxValue(i.maxConfigId),
      ),
      1, // default to 1 if not provided
    ),
    deviceAction: v.literal(i.deviceAction),
    configuration: v.object(i.configuration),
  })
}

// TODO: could be made configurable to the actual min max of the channel but then user config may conflict with schema json
export function createChannelConfigSchema() {
  return v.object({
    /**
     * Dead Band setting is limited to a maximum of 20% of the radio unit measuring range.
     * An invalid dead band value makes the whole channel process alarm configuration invalid.
     * Only uses the first 2 decimal places.
     * @minimum 0
     * @maximum 20
     */
    deadBand: v.pipe(
      v.number(),
      v.minValue(0, 'Dead Band must be at least 0%'),
      v.maxValue(20, 'Dead Band must be at most 20%'),
    ),
    alarms: v.optional(
      v.object({
        /**
         * High threshold alarm appears for a measurement above threshold + dead band
         * and disappears for a measurement below threshold - dead band.
         * In percent (%).
         * 0% corresponds to the lower limit of the measuring range, 100% corresponds to the upper limit of the measuring range.
         * Only uses the first 2 decimal places.
         * @minimum 0
         * @maximum 100
         * @example 75.75
         * @unit percent
         */
        lowThreshold: v.optional(
          v.pipe(
            v.number(),
            v.minValue(0, 'Low Threshold must be at least 0%'),
            v.maxValue(100, 'Low Threshold must be at most 100%'),
          ),
        ),
        /**
         * High threshold alarm appears for a measurement above threshold + dead band
         * and disappears for a measurement below threshold - dead band.
         * In percent (%).
         * 0% corresponds to the lower limit of the measuring range, 100% corresponds to the upper limit of the measuring range.
         * Only uses the first 2 decimal places.
         * @minimum 0
         * @maximum 100
         * @example 80.80
         * @unit percent
         */
        highThreshold: v.optional(
          v.pipe(
            v.number(),
            v.minValue(0, 'High Threshold must be at least 0%'),
            v.maxValue(100, 'High Threshold must be at most 100%'),
          ),
        ),
        lowThresholdWithDelay: v.optional(
          v.object({
            /**
             * Value for low threshold with delay.
             * Only uses the first 2 decimal places.
             * In percent (%).
             * 0% corresponds to the lower limit of the measuring range, 100% corresponds to the upper limit of the measuring range.
             * @minimum 0
             * @maximum 100
             * @example 10.10
             * @unit percent
             */
            value: v.pipe(
              v.number(),
              v.minValue(0, 'Low Threshold with Delay value must be at least 0%'),
              v.maxValue(100, 'Low Threshold with Delay value must be at most 100%'),
            ),
            /**
             * Delay in seconds (s). Must be a multiple of both the measurement period without alarm
             * and the measurement period with alarm.
             * @asType integer
             * @minimum 0
             * @maximum 65535
             * @unit seconds
             */
            delay: v.pipe(
              v.number(),
              v.integer(),
              v.minValue(0, 'Low Threshold with Delay delay must be at least 0'),
              v.maxValue(65535, 'Low Threshold with Delay delay must be at most 65535'),
            ),
          }),
        ),
        highThresholdWithDelay: v.optional(
          v.object({
            /**
             * Value for high threshold with delay in percent (%).
             * Only uses the first 2 decimal places.
             * In percent (%).
             * 0% corresponds to the lower limit of the measuring range, 100% corresponds to the upper limit of the measuring range.
             * @minimum 0
             * @maximum 100
             * @example 90.90
             * @unit percent
             */
            value: v.pipe(
              v.number(),
              v.minValue(0, 'High Threshold with Delay value must be at least 0%'),
              v.maxValue(100, 'High Threshold with Delay value must be at most 100%'),
            ),
            /**
             * Delay in seconds (s). Must be a multiple of both the measurement period without alarm
             * and the measurement period with alarm.
             * @asType integer
             * @minimum 0
             * @maximum 65535
             * @unit seconds
             */
            delay: v.pipe(
              v.number(),
              v.integer(),
              v.minValue(0, 'High Threshold with Delay delay must be at least 0'),
              v.maxValue(65535, 'High Threshold with Delay delay must be at most 65535'),
            ),
          }),
        ),
        /**
         * Rising slope alarm value in percent (%). Slope alarms can only be configured for a maximum of 50%
         * of the radio unit measuring range.
         * Only uses the first 2 decimal places.
         * @minimum 0
         * @maximum 50
         * @example 25.25
         * @unit percent
         */
        risingSlope: v.optional(
          v.pipe(
            v.number(),
            v.minValue(0, 'Rising Slope must be at least 0%'),
            v.maxValue(50, 'Rising Slope must be at most 50%'),
          ),
        ),
        /**
         * Falling slope alarm value in percent (%). Slope alarms can only be configured for a maximum of 50%
         * of the radio unit measuring range.
         * Only uses the first 2 decimal places.
         * @minimum 0
         * @maximum 50
         * @example 25.25
         * @unit percent
         */
        fallingSlope: v.optional(
          v.pipe(
            v.number(),
            v.minValue(0, 'Falling Slope must be at least 0%'),
            v.maxValue(50, 'Falling Slope must be at most 50%'),
          ),
        ),
      }),
    ),
  })
}

export function createChannelOffsetConfigurationSchema() {
  return v.object({
    /**
     * Offset value in percent (%). The offset is applied to the measurement value.
     * Only uses the first 2 decimal places.
     * @minimum -5
     * @maximum 5
     * @example 1.25
     * @unit percent
     */
    measureOffset: v.pipe(
      v.number(),
      v.minValue(-5, 'Offset must be at least -5%'),
      v.maxValue(5, 'Offset must be at most 5%'),
    ),
  })
}

export function createChannelStartUpTimeConfigurationSchema() {
  return v.object({
    /**
     * Start-up time in seconds (s).
     * Only uses the first decimal place.
     * @minimum 0.1
     * @maximum 15
     * @unit seconds
     */
    startUpTime: v.pipe(
      v.number(),
      v.integer(),
      v.minValue(0.1),
      v.maxValue(15),
    ),
  })
}

export function createMainConfigurationSchema() {
  return {
    measuringRateWhenNoAlarm: v.pipe(
      v.number(),
      v.integer(),
      v.minValue(60, 'Measuring rate when no alarm must be at least 60'),
      v.maxValue(86400, 'Measuring rate when no alarm must be at most 86400'),
    ),
    publicationFactorWhenNoAlarm: v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1, 'Publication factor when no alarm must be at least 1'),
      v.maxValue(2880, 'Publication factor when no alarm must be at most 2880'),
    ),
    measuringRateWhenAlarm: v.pipe(
      v.number(),
      v.integer(),
      v.minValue(60, 'Measuring rate when alarm must be at least 60'),
      v.maxValue(86400, 'Measuring rate when alarm must be at most 86400'),
    ),
    publicationFactorWhenAlarm: v.pipe(
      v.number(),
      v.integer(),
      v.minValue(1, 'Publication factor when alarm must be at least 1'),
      v.maxValue(2880, 'Publication factor when alarm must be at most 2880'),
    ),
  }
}

export function createDownlinkInputResetToFactorySchema() {
  return v.object({
    deviceAction: v.literal('resetToFactory'),
  })
}

export function createDownlinkInputBatteryResetSchema<TMaxId extends number>(maxId: TMaxId) {
  return v.object({
    configurationId: v.optional(
      v.pipe(
        v.number(),
        v.integer(),
        v.minValue(0),
        v.maxValue(maxId),
      ),
      1, // default to 1 if not provided
    ),
    deviceAction: v.literal('resetBatteryIndicator'),
  })
}
