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

export interface Tulip2DownlinkSpanLimitFactors {
  deadBandMaxSpanFactor?: number
  slopeMaxSpanFactor?: number
  measureOffsetMinSpanFactor?: number
  measureOffsetMaxSpanFactor?: number
}

export function createConfigurationIdSchema(maxConfigId: number) {
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

function createTulip2DownlinkChannelSchema<TFeatureFlags extends Tulip2EncodeFeatureFlags>(
  channel: TULIP2Channel,
  featureFlags: TFeatureFlags,
  spanLimitFactors?: Tulip2DownlinkSpanLimitFactors,
): Tulip2DownlinkChannelSchema<TFeatureFlags> {
  const span = channel.end - channel.start
  const deadBandMaxSpanFactor = spanLimitFactors?.deadBandMaxSpanFactor ?? 1
  const slopeMaxSpanFactor = spanLimitFactors?.slopeMaxSpanFactor ?? 1
  const measureOffsetMinSpanFactor = spanLimitFactors?.measureOffsetMinSpanFactor ?? 1
  const measureOffsetMaxSpanFactor = spanLimitFactors?.measureOffsetMaxSpanFactor ?? 1

  const baseSchema = {

    alarms: v.optional(
      v.object({
        // deadBand allows for 0 - 20% of the span to be configured
        // here that is 0 - span * 0.2
        deadBand: v.pipe(
          v.number(),
          v.minValue(0),
          v.maxValue(span * deadBandMaxSpanFactor),
          // now we transfrom the deadBand value from the real value to the percentage of the span, since that's what the encoder expects
          v.transform(v => Math.round((v / span) * 100 * 100)),
        ),
        // low threshold and high threshold are in percentage 0 - 100% from the actual min max range
        lowThreshold: v.optional(
          v.pipe(
            v.number(),
            v.minValue(channel.start),
            v.maxValue(channel.end),
            // now we transform the threshold values from the real value to the percentage of the span, since that's what the encoder expects, and we also add 2500 to move the range from -2500-7500 (representing -50%-+100%) to 0-10000 (representing 0%-100%)
            v.transform(v => Math.round((((v - channel.start) / span) * 100 * 100) + 2500)),
          ),
        ),
        // high threshold and high threshold are in percentage 0 - 100% from the actual min max range
        highThreshold: v.optional(
          v.pipe(
            v.number(),
            v.minValue(channel.start),
            v.maxValue(channel.end),
            // now we transform the threshold values from the real value to the percentage of the span, since that's what the encoder expects, and we also add 2500 to move the range from -2500-7500 (representing -50%-+100%) to 0-10000 (representing 0%-100%)
            v.transform(v => Math.round((((v - channel.start) / span) * 100 * 100) + 2500)),
          ),
        ),
        // low and high threshold with delay are in percentage 0 - 100% from the actual min max range
        lowThresholdWithDelay: v.optional(
          v.object({
            value: v.pipe(
              v.number(),
              v.minValue(channel.start),
              v.maxValue(channel.end),
              // now we transform the threshold values from the real value to the percentage of the span, since that's what the encoder expects, and we also add 2500 to move the range from -2500-7500 (representing -50%-+100%) to 0-10000 (representing 0%-100%)
              v.transform(v => Math.round((((v - channel.start) / span) * 100 * 100) + 2500)),
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
              v.transform(v => Math.round((((v - channel.start) / span) * 100 * 100) + 2500)),
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
            v.maxValue(span * slopeMaxSpanFactor),
            // now we transform the slope values from the real value to the percentage of the span, since that's what the encoder expects
            v.transform(v => Math.round((v / span) * 100 * 100)),
          ),
        ),
        fallingSlope: v.optional(
          v.pipe(
            v.number(),
            v.minValue(0),
            v.maxValue(span * slopeMaxSpanFactor),
            // now we transform the slope values from the real value to the percentage of the span, since that's what the encoder expects
            v.transform(v => Math.round((v / span) * 100 * 100)),
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
          v.transform(v => Math.round(v * 10)),
        ),
      ),
    })
  }

  if (featureFlags.channelsMeasureOffset) {
    Object.assign(baseSchema, {
      // offset is from e.g. -5% to +5% of the span
      measureOffset: v.optional(
        v.pipe(
          v.number(),
          v.minValue(-measureOffsetMinSpanFactor * span),
          v.maxValue(measureOffsetMaxSpanFactor * span),
          v.transform(v => Math.round((v / span) * 100 * 100)),
        ),
      ),
    })
  }

  return v.object(baseSchema) as unknown as Tulip2DownlinkChannelSchema<TFeatureFlags>
}

type Tulip2ChannelSchemasObject<TChannels extends TULIP2Channel[], TFeatureFlags extends Tulip2EncodeFeatureFlags> = {
  [K in TChannels[number] as `channel${K['channelId']}`]: v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<false, undefined>, v.LiteralSchema<true, undefined>, Tulip2DownlinkChannelSchema<TFeatureFlags>], undefined>, undefined>
}

function createTulip2DownlinkConfigurationFrameSchema<TChannel extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags>(
  channels: TChannel[],
  featureFlags: TFeatureFlags,
  spanLimitFactors?: Tulip2DownlinkSpanLimitFactors,
) {
  const channelSchemas: Tulip2ChannelSchemasObject<TChannel[], TFeatureFlags> = channels.reduce((acc, channel) => {
    const channelKey = `channel${channel.channelId}` as `channel${TChannel['channelId']}`

    // @ts-expect-error - TypeScript can't infer that this specific channel.channelId matches the mapped type key
    acc[channelKey] = v.optional(
      v.union([
        v.literal(false),
        v.literal(true),
        createTulip2DownlinkChannelSchema(channel, featureFlags, spanLimitFactors),
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

export function createTULIP2DownlinkSchema<TChannels extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags>(
  channels: TChannels[],
  featureFlags: TFeatureFlags,
  extraActions?: v.ObjectSchema<any, any>[],
  spanLimitFactors?: Tulip2DownlinkSpanLimitFactors,
) {
  return v.variant('deviceAction', [
    createDownlinkResetToFactorySchema(),
    createDownlinkResetBatteryIndicatorSchema(featureFlags),
    createTulip2DownlinkConfigurationFrameSchema(channels, featureFlags, spanLimitFactors),
    ...(extraActions ?? []),
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
  extraActions?: v.ObjectSchema<any, any>[],
  spanLimitFactors?: Tulip2DownlinkSpanLimitFactors,
): TULIP2DownlinkInput<TChannels, TFeatureFlags> {
  const schema = createTULIP2DownlinkSchema(channels, featureFlags, extraActions, spanLimitFactors)
  const res = v.safeParse(schema, input)
  if (!res.success) {
    throw new Error(v.summarize(res.issues))
  }
  return res.output as TULIP2DownlinkInput<TChannels, TFeatureFlags>
}
