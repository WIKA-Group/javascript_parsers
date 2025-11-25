/* eslint-disable ts/explicit-function-return-type */
import type { TULIP2Channel } from '../../codecs/tulip2'
import * as v from 'valibot'

export interface Tulip2EncodeFeatureFlags {
  maxConfigId: number
  channelsStartupTime?: boolean
  channelsMeasureOffset?: boolean
  mainConfigBLE?: boolean
  mainConfigSingleMeasuringRate?: boolean
}

function createConfigurationIdSchema(maxConfigId: number) {
  return v.optional(
    v.pipe(
      v.number('configurationId needs to be a number'),
      v.minValue(1, 'configurationId needs to be at least 1'),
      v.maxValue(maxConfigId, `configurationId needs to be at most ${maxConfigId}`),
      v.integer('configurationId needs to be an integer'),
    ),
  )
}

// Base main config: no BLE, separate measuring rates
type Tulip2DownlinkMainConfigBase = v.ObjectSchema<{
  publicationFactorWhenAlarm: v.NumberSchema<undefined>
  publicationFactorWhenNoAlarm: v.NumberSchema<undefined>
  measuringRateWhenNoAlarm: v.NumberSchema<undefined>
  measuringRateWhenAlarm: v.NumberSchema<undefined>
}, undefined>

// With BLE, separate measuring rates
type Tulip2DownlinkMainConfigWithBLE = v.ObjectSchema<{
  publicationFactorWhenAlarm: v.NumberSchema<undefined>
  publicationFactorWhenNoAlarm: v.NumberSchema<undefined>
  isBLEEnabled: v.BooleanSchema<undefined>
  measuringRateWhenNoAlarm: v.NumberSchema<undefined>
  measuringRateWhenAlarm: v.NumberSchema<undefined>
}, undefined>

// No BLE, single measuring rate
type Tulip2DownlinkMainConfigSingleRate = v.ObjectSchema<{
  publicationFactorWhenAlarm: v.NumberSchema<undefined>
  publicationFactorWhenNoAlarm: v.NumberSchema<undefined>
  measuringRate: v.NumberSchema<undefined>
}, undefined>

// With BLE, single measuring rate
type Tulip2DownlinkMainConfigWithBLEAndSingleRate = v.ObjectSchema<{
  publicationFactorWhenAlarm: v.NumberSchema<undefined>
  publicationFactorWhenNoAlarm: v.NumberSchema<undefined>
  isBLEEnabled: v.BooleanSchema<undefined>
  measuringRate: v.NumberSchema<undefined>
}, undefined>

type Tulip2DownlinkMainConfiguration<TFeatureFlags extends Tulip2EncodeFeatureFlags>
  = TFeatureFlags['mainConfigBLE'] extends true
    ? TFeatureFlags['mainConfigSingleMeasuringRate'] extends true
      ? Tulip2DownlinkMainConfigWithBLEAndSingleRate
      : Tulip2DownlinkMainConfigWithBLE
    : TFeatureFlags['mainConfigSingleMeasuringRate'] extends true
      ? Tulip2DownlinkMainConfigSingleRate
      : Tulip2DownlinkMainConfigBase

function createTulip2DownlinkMainConfigurationSchema<TFeatureFlags extends Tulip2EncodeFeatureFlags>(featureFlags: TFeatureFlags): Tulip2DownlinkMainConfiguration<TFeatureFlags> {
  const baseSchema = {
    publicationFactorWhenAlarm: v.pipe(
      v.number(),
      v.minValue(1),
      v.maxValue(2880),
      v.integer(),
    ),
    publicationFactorWhenNoAlarm: v.pipe(
      v.number(),
      v.minValue(1),
      v.maxValue(2880),
      v.integer(),
    ),
  }

  if (featureFlags.mainConfigBLE) {
    Object.assign(baseSchema, {
      isBLEEnabled: v.boolean(),
    })
  }

  if (featureFlags.mainConfigSingleMeasuringRate) {
    Object.assign(baseSchema, {
      measuringRate: v.pipe(
        v.number(),
        v.minValue(60),
        v.maxValue(86400),
        v.integer(),
      ),
    })
  }
  else {
    Object.assign(baseSchema, {
      measuringRateWhenNoAlarm: v.pipe(
        v.number(),
        v.minValue(60),
        v.maxValue(86400),
        v.integer(),
      ),
      measuringRateWhenAlarm: v.pipe(
        v.number(),
        v.minValue(60),
        v.maxValue(86400),
        v.integer(),
      ),
    })
  }

  return v.object(baseSchema) as unknown as Tulip2DownlinkMainConfiguration<TFeatureFlags>
}

// Base channel schema: no optional features
type Tulip2DownlinkChannelSchemaBase = v.ObjectSchema<{
  alarms: v.OptionalSchema<v.ObjectSchema<{
    deadBand: v.NumberSchema<undefined>
    lowThreshold: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    highThreshold: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    lowThresholdWithDelay: v.OptionalSchema<v.ObjectSchema<{
      value: v.NumberSchema<undefined>
      delay: v.NumberSchema<undefined>
    }, undefined>, undefined>
    highThresholdWithDelay: v.OptionalSchema<v.ObjectSchema<{
      value: v.NumberSchema<undefined>
      delay: v.NumberSchema<undefined>
    }, undefined>, undefined>
    risingSlope: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    fallingSlope: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  }, undefined>, undefined>
}, undefined>

// With startup time
type Tulip2DownlinkChannelSchemaWithStartup = v.ObjectSchema<{
  alarms: v.OptionalSchema<v.ObjectSchema<{
    deadBand: v.NumberSchema<undefined>
    lowThreshold: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    highThreshold: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    lowThresholdWithDelay: v.OptionalSchema<v.ObjectSchema<{
      value: v.NumberSchema<undefined>
      delay: v.NumberSchema<undefined>
    }, undefined>, undefined>
    highThresholdWithDelay: v.OptionalSchema<v.ObjectSchema<{
      value: v.NumberSchema<undefined>
      delay: v.NumberSchema<undefined>
    }, undefined>, undefined>
    risingSlope: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    fallingSlope: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  }, undefined>, undefined>
  startUpTime: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
}, undefined>

// With measure offset
type Tulip2DownlinkChannelSchemaWithOffset = v.ObjectSchema<{
  alarms: v.OptionalSchema<v.ObjectSchema<{
    deadBand: v.NumberSchema<undefined>
    lowThreshold: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    highThreshold: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    lowThresholdWithDelay: v.OptionalSchema<v.ObjectSchema<{
      value: v.NumberSchema<undefined>
      delay: v.NumberSchema<undefined>
    }, undefined>, undefined>
    highThresholdWithDelay: v.OptionalSchema<v.ObjectSchema<{
      value: v.NumberSchema<undefined>
      delay: v.NumberSchema<undefined>
    }, undefined>, undefined>
    risingSlope: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    fallingSlope: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  }, undefined>, undefined>
  measureOffset: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
}, undefined>

// With both startup time and measure offset
type Tulip2DownlinkChannelSchemaWithBoth = v.ObjectSchema<{
  alarms: v.OptionalSchema<v.ObjectSchema<{
    deadBand: v.NumberSchema<undefined>
    lowThreshold: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    highThreshold: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    lowThresholdWithDelay: v.OptionalSchema<v.ObjectSchema<{
      value: v.NumberSchema<undefined>
      delay: v.NumberSchema<undefined>
    }, undefined>, undefined>
    highThresholdWithDelay: v.OptionalSchema<v.ObjectSchema<{
      value: v.NumberSchema<undefined>
      delay: v.NumberSchema<undefined>
    }, undefined>, undefined>
    risingSlope: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
    fallingSlope: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  }, undefined>, undefined>
  startUpTime: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
  measureOffset: v.OptionalSchema<v.NumberSchema<undefined>, undefined>
}, undefined>

type Tulip2DownlinkChannelSchema<TFeatureFlags extends Tulip2EncodeFeatureFlags>
  = TFeatureFlags['channelsStartupTime'] extends true
    ? TFeatureFlags['channelsMeasureOffset'] extends true
      ? Tulip2DownlinkChannelSchemaWithBoth
      : Tulip2DownlinkChannelSchemaWithStartup
    : TFeatureFlags['channelsMeasureOffset'] extends true
      ? Tulip2DownlinkChannelSchemaWithOffset
      : Tulip2DownlinkChannelSchemaBase

function createTulip2DownlinkChannelSchema<TFeatureFlags extends Tulip2EncodeFeatureFlags>(channel: TULIP2Channel, featureFlags: TFeatureFlags): Tulip2DownlinkChannelSchema<TFeatureFlags> {
  const span = channel.end - channel.start
  const baseSchema = {

    alarms: v.optional(
      v.object({
        // deadBand allows for 0 - 20% of the span to be configured
        // here that is 0 - span * 0.2
        deadBand: v.pipe(
          v.number(),
          v.minValue(0),
          v.maxValue(span * 0.2),
        ),
        // low threshold and high threshold are in percentage 0 - 100% from the actual min max range
        lowThreshold: v.optional(
          v.pipe(
            v.number(),
            v.minValue(channel.start),
            v.maxValue(channel.end),
          ),
        ),
        // high threshold and high threshold are in percentage 0 - 100% from the actual min max range
        highThreshold: v.optional(
          v.pipe(
            v.number(),
            v.minValue(channel.start),
            v.maxValue(channel.end),
          ),
        ),
        // low and high threshold with delay are in percentage 0 - 100% from the actual min max range
        lowThresholdWithDelay: v.optional(
          v.object({
            value: v.pipe(
              v.number(),
              v.minValue(channel.start),
              v.maxValue(channel.end),
            ),
            delay: v.pipe(
              v.number(),
              v.minValue(0),
              v.maxValue(65535),
              v.integer(),
            ),
          }),
        ),
        // low and high threshold with delay are in percentage 0 - 100% from the actual min max range
        highThresholdWithDelay: v.optional(
          v.object({
            value: v.pipe(
              v.number(),
              v.minValue(channel.start),
              v.maxValue(channel.end),
            ),
            delay: v.pipe(
              v.number(),
              v.minValue(0),
              v.maxValue(65535),
              v.integer(),
            ),
          }),
        ),
        // slopes can only be between 0 and 50% of the span
        risingSlope: v.optional(
          v.pipe(
            v.number(),
            v.minValue(0),
            v.maxValue(span * 0.5),
          ),
        ),
        fallingSlope: v.optional(
          v.pipe(
            v.number(),
            v.minValue(0),
            v.maxValue(span * 0.5),
          ),
        ),
      }),
    ),
  }

  if (featureFlags.channelsStartupTime) {
    Object.assign(baseSchema, {
      // startup time configuration for the channel is from 0.1 to 15 seconds
      // in 0.1s (100ms steps)
      startUpTime: v.optional(
        v.pipe(
          v.number(),
          v.minValue(0.1),
          v.maxValue(15),
        ),
      ),
    })
  }

  if (featureFlags.channelsMeasureOffset) {
    Object.assign(baseSchema, {
      // offset is from -5% to +5% of the span
      measureOffset: v.optional(
        v.pipe(
          v.number(),
          v.minValue(-0.05 * span),
          v.maxValue(0.05 * span),
        ),
      ),
    })
  }

  return v.object(baseSchema) as unknown as Tulip2DownlinkChannelSchema<TFeatureFlags>
}

type Tulip2ChannelSchemasObject<TChannels extends TULIP2Channel[], TFeatureFlags extends Tulip2EncodeFeatureFlags> = {
  [K in TChannels[number] as `channel${K['channelId']}`]: v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<false, undefined>, v.LiteralSchema<true, undefined>, Tulip2DownlinkChannelSchema<TFeatureFlags>], undefined>, undefined>
}

function createTulip2DownlinkConfigurationFrameSchema<TChannel extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags>(channels: TChannel[], featureFlags: TFeatureFlags) {
  const channelSchemas: Tulip2ChannelSchemasObject<TChannel[], TFeatureFlags> = channels.reduce((acc, channel) => {
    const channelKey = `channel${channel.channelId}` as `channel${TChannel['channelId']}`

    // @ts-expect-error - TypeScript can't infer that this specific channel.channelId matches the mapped type key
    acc[channelKey] = v.optional(
      v.union([
        v.literal(false),
        v.literal(true),
        createTulip2DownlinkChannelSchema(channel, featureFlags),
      ]),
    )
    return acc
  }, {} as Tulip2ChannelSchemasObject<TChannel[], TFeatureFlags>)

  return v.object({
    deviceAction: v.literal('configuration'),
    byteLimit:
          v.optional(v.pipe(
            v.number(),
            v.minValue(0),
            v.integer(),
          )),
    configurationId: createConfigurationIdSchema(featureFlags.maxConfigId),
    mainConfiguration: v.optional(createTulip2DownlinkMainConfigurationSchema(featureFlags)),
    ...channelSchemas,
  })
}

function createDownlinkResetToFactorySchema() {
  return v.object({
    deviceAction: v.literal('resetToFactory'),
  })
}

function createDownlinkResetBatteryIndicatorSchema(featureFlags: Tulip2EncodeFeatureFlags) {
  return v.object({
    configurationId: createConfigurationIdSchema(featureFlags.maxConfigId),
    deviceAction: v.literal('resetBatteryIndicator'),
  })
}

export function createTULIP2DownlinkSchema<TChannels extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags>(channels: TChannels[], featureFlags: TFeatureFlags) {
  return v.variant('deviceAction', [
    createDownlinkResetToFactorySchema(),
    createDownlinkResetBatteryIndicatorSchema(featureFlags),
    // @ts-expect-error - TS can't infer generics in this context
    createTulip2DownlinkConfigurationFrameSchema(channels, featureFlags),
  ])
}

type DownlinkResetToFactory = v.InferOutput<ReturnType<typeof createDownlinkResetToFactorySchema>>
type DownlinkResetBatteryIndicator = v.InferOutput<ReturnType<typeof createDownlinkResetBatteryIndicatorSchema>>

// Manually type the configuration frame output since ReturnType with generics doesn't work with Valibot's constraints
type ChannelConfigOutput<TFeatureFlags extends Tulip2EncodeFeatureFlags>
  = | false
    | true
    | v.InferOutput<Tulip2DownlinkChannelSchema<TFeatureFlags>>

type ChannelSchemasOutput<TChannels extends TULIP2Channel[], TFeatureFlags extends Tulip2EncodeFeatureFlags> = {
  [K in TChannels[number] as `channel${K['channelId']}`]?: ChannelConfigOutput<TFeatureFlags>
}

type DownlinkConfigurationFrame<TChannels extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags> = {
  deviceAction: 'configuration'
  byteLimit?: number
  configurationId?: number
  mainConfiguration?: v.InferOutput<Tulip2DownlinkMainConfiguration<TFeatureFlags>>
} & ChannelSchemasOutput<TChannels[], TFeatureFlags>

export type TULIP2DownlinkInput<TChannels extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags>
  = DownlinkResetToFactory
    | DownlinkResetBatteryIndicator
    | DownlinkConfigurationFrame<TChannels, TFeatureFlags>

/**
 * Validate TULIP2 downlink input for a given set of channels and feature flags.
 * Has to be used as dynamic valibot schemas cannot be correctly inferred by TypeScript.
 * @param input Input to validate
 * @param channels TULIP2 channels
 * @param featureFlags Feature flags for the downlink
 * @returns Validated downlink input
 * @throws Error if the input is invalid. Should be caught and handled by the caller (parser that uses codec that uses this).
 */
export function validateTULIP2DownlinkInput<TChannels extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags>(
  input: unknown,
  channels: TChannels[],
  featureFlags: TFeatureFlags,
): TULIP2DownlinkInput<TChannels, TFeatureFlags> {
  const schema = createTULIP2DownlinkSchema(channels, featureFlags)
  const res = v.safeParse(schema, input)
  if (!res.success) {
    throw new Error(`Invalid downlink input: ${res.issues.map(i => i.message).join(', ')}`)
  }
  return res.output as TULIP2DownlinkInput<TChannels, TFeatureFlags>
}

/**
 * Reformat downlink input to convert their real values into expected uint16 values for downlink encoding.
 *
 * The encoding functions expect values in specific formats:
 * - **deadBand**: percentage of span (0-20%), kept as-is since encoder multiplies by 100
 * - **thresholds**: uint16 in 0.01% units (0-10000 representing 0.00%-100.00%)
 * - **slopes**: uint16 in 0.01% units (0-5000 representing 0.00%-50.00% of span)
 * - **measureOffset**: percentage of span (-5% to +5%), kept as-is since encoder multiplies by 100
 * - **startUpTime**: seconds (0.1-15s), kept as-is since encoder multiplies by 10
 *
 * @param input - The validated downlink input with real measurement values
 * @param channels - The channel definitions with start/end ranges
 * @param _featureFlags - Feature flags (unused in reformatting but kept for consistency)
 * @returns Reformatted downlink input with values converted to encoding-ready format
 */
export function reformatDownlinkInputValues<TChannels extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags>(input: TULIP2DownlinkInput<TChannels, TFeatureFlags>, channels: TChannels[], _featureFlags: TFeatureFlags): TULIP2DownlinkInput<TChannels, TFeatureFlags> {
  // Only configuration frames have values to reformat
  if (input.deviceAction !== 'configuration') {
    return input
  }

  // Deep clone to avoid mutating the input
  const output = input

  // Process each channel that might be configured
  for (const channel of channels) {
    const channelKey = `channel${channel.channelId}`
    const channelConfig = output[channelKey as keyof typeof output] as ChannelConfigOutput<TFeatureFlags>

    // Skip if channel is not configured or is a boolean (false=disabled, true=enabled with defaults)
    if (!channelConfig || typeof channelConfig === 'boolean') {
      continue
    }

    const span = Math.abs(channel.end - channel.start)

    // 1. Convert deadBand from span value to percentage (0-20%)
    if (typeof channelConfig.alarms?.deadBand === 'number') {
      channelConfig.alarms.deadBand = (channelConfig.alarms.deadBand / span) * 100
    }

    // 2. Convert alarm thresholds and slopes
    if (channelConfig.alarms && typeof channelConfig.alarms === 'object') {
      const alarms = channelConfig.alarms

      // Convert threshold values from real values to uint16 (2500-12500 in 0.01% units)
      if (typeof alarms.lowThreshold === 'number') {
        alarms.lowThreshold = Math.round((((alarms.lowThreshold - channel.start) / span) * 100) * 100 + 2500)
      }

      if (typeof alarms.highThreshold === 'number') {
        alarms.highThreshold = Math.round((((alarms.highThreshold - channel.start) / span) * 100) * 100 + 2500)
      }

      if (alarms.lowThresholdWithDelay && typeof alarms.lowThresholdWithDelay.value === 'number') {
        alarms.lowThresholdWithDelay.value = Math.round((((alarms.lowThresholdWithDelay.value - channel.start) / span) * 100) * 100 + 2500)
      }

      if (alarms.highThresholdWithDelay && typeof alarms.highThresholdWithDelay.value === 'number') {
        alarms.highThresholdWithDelay.value = Math.round((((alarms.highThresholdWithDelay.value - channel.start) / span) * 100) * 100 + 2500)
      }

      // Convert slopes from span values to uint16 (0-5000 in 0.01% units for 0-50%)
      if (typeof alarms.risingSlope === 'number') {
        alarms.risingSlope = Math.round(((alarms.risingSlope / span) * 100) * 100)
      }

      if (typeof alarms.fallingSlope === 'number') {
        alarms.fallingSlope = Math.round(((alarms.fallingSlope / span) * 100) * 100)
      }
    }

    // 3. Convert measureOffset from span value to percentage (-5% to +5%)
    if ('measureOffset' in channelConfig && typeof channelConfig.measureOffset === 'number') {
      channelConfig.measureOffset = (channelConfig.measureOffset / span) * 100
    }

    // 4. startUpTime is already in seconds (0.1-15s), no conversion needed
  }

  return output as TULIP2DownlinkInput<TChannels, TFeatureFlags>
}
