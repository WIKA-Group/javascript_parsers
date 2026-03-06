/* eslint-disable ts/explicit-function-return-type */
import type { TULIP2Channel } from '../../codecs/tulip2'
import * as v from 'valibot'

export interface Tulip2EncodeFeatureFlags {
  /**
   * Maximum allowed configurationId value for actions that include configurationId.
   * Used by the generated action schema validators.
   */
  maxConfigId: number
  /**
   * Enables `startUpTime` on per-channel configuration object schemas.
   * If omitted/false, `startUpTime` is not accepted.
   */
  channelsStartupTime?: boolean
  /**
   * Enables `measureOffset` on per-channel configuration object schemas.
   * If omitted/false, `measureOffset` is not accepted.
   */
  channelsMeasureOffset?: boolean
  /**
   * Enables `isBLEEnabled` in mainConfiguration schema.
   */
  mainConfigBLE?: boolean
  /**
   * Switches mainConfiguration from dual measuring rates
   * (`measuringRateWhenNoAlarm` + `measuringRateWhenAlarm`)
   * to single `measuringRate`.
   */
  mainConfigSingleMeasuringRate?: boolean
  /**
   * Channel keys that must be boolean-only in configuration actions.
   *
   * Example: `['channel1']`
   * - `channel1: true | false` is allowed
   * - `channel1: { alarms: ... }` is rejected by schema
   *
   * This also affects TypeScript output types (`TULIP2ConfigurationAction`) so
   * listed channels are inferred as `true | false` only, while other channels
   * still allow full channel configuration objects.
   */
  channelsBooleanOnly?: readonly [`channel${number}`, ...`channel${number}`[]]
}

export interface Tulip2DownlinkSpanLimitFactors {
  /**
   * The maximum span factor for the dead band, meaning that the allowed dead band will be at most span * this factor.
   * Default is 1 (100%).
   * Only set if the dead band range is restricted to a smaller range than the full span, e.g. 10% of the span would be a factor of 0.1.
   */
  deadBandMaxSpanFactor?: number
  /**
   * The maximum span factor for the slope, meaning that the allowed slope will be at most span * this factor.
   * Default is 1 (100%).
   * Only set if the slope range is restricted to a smaller range than the full span, e.g. 10% of the span would be a factor of 0.1.
   */
  slopeMaxSpanFactor?: number
  /**
   * The minimum span factor for the measure offset, meaning that the allowed measure offset will be at least +/- span * this factor.
   * Default is 1 (100%).
   * Only set if the offset range is restricted to a smaller range than the full span, e.g. +/- 5% of the span would be a factor of 0.05.
   */
  measureOffsetMinSpanFactor?: number
  /**
   * The maximum span factor for the measure offset, meaning that the allowed measure offset will be at most +/- span * this factor.
   * Default is 1 (100%).
   * Only set if the offset range is restricted to a smaller range than the full span, e.g. +/- 5% of the span would be a factor of 0.05.
   */
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

function createByteLimitSchema() {
  return v.optional(v.pipe(
    v.number(),
    v.minValue(0),
    v.integer(),
  ))
}

interface TULIP2DownlinkActionMetaOptions {
  configurationId?: boolean
  byteLimit?: boolean
}

type TULIP2BaseActionEntries<TAction extends string, TObjectExtension extends v.ObjectEntries> = {
  deviceAction: v.LiteralSchema<TAction, undefined>
} & TObjectExtension

type TULIP2ActionEntriesWithConfigurationId<TAction extends string, TObjectExtension extends v.ObjectEntries>
  = TULIP2BaseActionEntries<TAction, TObjectExtension>
    & {
      configurationId: ReturnType<typeof createConfigurationIdSchema>
    }

type TULIP2ActionEntriesWithByteLimit<TAction extends string, TObjectExtension extends v.ObjectEntries>
  = TULIP2BaseActionEntries<TAction, TObjectExtension>
    & {
      byteLimit: ReturnType<typeof createByteLimitSchema>
    }

type TULIP2ActionEntriesWithConfigurationIdAndByteLimit<TAction extends string, TObjectExtension extends v.ObjectEntries>
  = TULIP2ActionEntriesWithConfigurationId<TAction, TObjectExtension>
    & TULIP2ActionEntriesWithByteLimit<TAction, TObjectExtension>

type TULIP2ActionSchemaByMeta<
  TAction extends string,
  TObjectExtension extends v.ObjectEntries,
  TMeta extends TULIP2DownlinkActionMetaOptions | undefined,
> = TMeta extends { configurationId: false }
  ? TMeta extends { byteLimit: false }
    ? v.ObjectSchema<TULIP2BaseActionEntries<TAction, TObjectExtension>, undefined>
    : v.ObjectSchema<TULIP2ActionEntriesWithByteLimit<TAction, TObjectExtension>, undefined>
  : TMeta extends { byteLimit: false }
    ? v.ObjectSchema<TULIP2ActionEntriesWithConfigurationId<TAction, TObjectExtension>, undefined>
    : v.ObjectSchema<TULIP2ActionEntriesWithConfigurationIdAndByteLimit<TAction, TObjectExtension>, undefined>

function createGenericTULIP2DownlinkActionSchema<const TMaxConfigId extends number, const TAction extends string, const TObjectExtension extends v.ObjectEntries = Record<never, never>>(i: {
  action: TAction
  maxConfigId: TMaxConfigId
  extension?: TObjectExtension
  meta?: {
    configurationId?: true
    byteLimit?: true
  }
}): v.ObjectSchema<TULIP2ActionEntriesWithConfigurationIdAndByteLimit<TAction, TObjectExtension>, undefined>
function createGenericTULIP2DownlinkActionSchema<const TMaxConfigId extends number, const TAction extends string, const TObjectExtension extends v.ObjectEntries = Record<never, never>>(i: {
  action: TAction
  maxConfigId: TMaxConfigId
  extension?: TObjectExtension
  meta: {
    configurationId: false
    byteLimit?: true
  }
}): v.ObjectSchema<TULIP2ActionEntriesWithByteLimit<TAction, TObjectExtension>, undefined>
function createGenericTULIP2DownlinkActionSchema<const TMaxConfigId extends number, const TAction extends string, const TObjectExtension extends v.ObjectEntries = Record<never, never>>(i: {
  action: TAction
  maxConfigId: TMaxConfigId
  extension?: TObjectExtension
  meta: {
    configurationId?: true
    byteLimit: false
  }
}): v.ObjectSchema<TULIP2ActionEntriesWithConfigurationId<TAction, TObjectExtension>, undefined>
function createGenericTULIP2DownlinkActionSchema<const TMaxConfigId extends number, const TAction extends string, const TObjectExtension extends v.ObjectEntries = Record<never, never>>(i: {
  action: TAction
  maxConfigId: TMaxConfigId
  extension?: TObjectExtension
  meta: {
    configurationId: false
    byteLimit: false
  }
}): v.ObjectSchema<TULIP2BaseActionEntries<TAction, TObjectExtension>, undefined>
function createGenericTULIP2DownlinkActionSchema<const TMaxConfigId extends number, const TAction extends string, const TObjectExtension extends v.ObjectEntries = Record<never, never>>(i: {
  action: TAction
  maxConfigId: TMaxConfigId
  extension?: TObjectExtension
  meta?: TULIP2DownlinkActionMetaOptions
}): v.ObjectSchema<v.ObjectEntries, undefined>
function createGenericTULIP2DownlinkActionSchema<const TMaxConfigId extends number, const TAction extends string, const TObjectExtension extends v.ObjectEntries = Record<never, never>>(i: {
  action: TAction
  maxConfigId: TMaxConfigId
  extension?: TObjectExtension
  meta?: TULIP2DownlinkActionMetaOptions
}): v.ObjectSchema<v.ObjectEntries, undefined> {
  const includeConfigurationId = i.meta?.configurationId ?? true
  const includeByteLimit = i.meta?.byteLimit ?? true
  const extension = (i.extension ?? {}) as TObjectExtension

  if (includeConfigurationId && includeByteLimit) {
    return v.object({
      deviceAction: v.literal(i.action),
      configurationId: createConfigurationIdSchema(i.maxConfigId),
      byteLimit: createByteLimitSchema(),
      ...extension,
    })
  }

  if (includeConfigurationId) {
    return v.object({
      deviceAction: v.literal(i.action),
      configurationId: createConfigurationIdSchema(i.maxConfigId),
      ...extension,
    })
  }

  if (includeByteLimit) {
    return v.object({
      deviceAction: v.literal(i.action),
      byteLimit: createByteLimitSchema(),
      ...extension,
    })
  }

  return v.object({
    deviceAction: v.literal(i.action),
    ...extension,
  })
}

export function createTULIP2DownlinkActionSchemaFactory<const TMaxConfigId extends number>(
  maxConfigId: TMaxConfigId,
) {
  return <
    const TAction extends string,
    const TObjectExtension extends v.ObjectEntries = Record<never, never>,
    const TMeta extends TULIP2DownlinkActionMetaOptions | undefined = undefined,
  >(i: {
    action: TAction
    extension?: TObjectExtension
    meta?: TMeta
  }): TULIP2ActionSchemaByMeta<TAction, TObjectExtension, TMeta> => {
    return createGenericTULIP2DownlinkActionSchema({
      action: i.action,
      maxConfigId,
      extension: i.extension,
      meta: i.meta,
    } as {
      action: TAction
      maxConfigId: TMaxConfigId
      extension?: TObjectExtension
      meta?: TULIP2DownlinkActionMetaOptions
    }) as unknown as TULIP2ActionSchemaByMeta<TAction, TObjectExtension, TMeta>
  }
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
  [K in TChannels[number] as `channel${K['channelId']}`]: `channel${K['channelId']}` extends ChannelBooleanOnlyKeys<TFeatureFlags>
    ? v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<false, undefined>, v.LiteralSchema<true, undefined>], undefined>, undefined>
    : v.OptionalSchema<v.UnionSchema<[v.LiteralSchema<false, undefined>, v.LiteralSchema<true, undefined>, Tulip2DownlinkChannelSchema<TFeatureFlags>], undefined>, undefined>
}

type ChannelBooleanOnlyKeys<TFeatureFlags extends Tulip2EncodeFeatureFlags>
  = TFeatureFlags['channelsBooleanOnly'] extends readonly `channel${number}`[] ? TFeatureFlags['channelsBooleanOnly'][number] : never

export function createTULIP2DownlinkConfigurationActionSchema<TChannel extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags>(
  channels: TChannel[],
  featureFlags: TFeatureFlags,
  spanLimitFactors?: Tulip2DownlinkSpanLimitFactors,
) {
  const createActionSchema = createTULIP2DownlinkActionSchemaFactory(featureFlags.maxConfigId)
  const channelsBooleanOnly = new Set(featureFlags.channelsBooleanOnly ?? [])
  const channelSchemas: Tulip2ChannelSchemasObject<TChannel[], TFeatureFlags> = channels.reduce((acc, channel) => {
    const channelKey = `channel${channel.channelId}` as `channel${TChannel['channelId']}`

    if (channelsBooleanOnly.has(channelKey)) {
      // @ts-expect-error - TypeScript can't infer that this specific channel.channelId matches the mapped type key
      acc[channelKey] = v.optional(
        v.union([
          v.literal(false),
          v.literal(true),
        ]),
      )
      return acc
    }

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

  return createActionSchema({
    action: 'configuration',
    extension: {
      mainConfiguration: v.optional(createTulip2DownlinkMainConfigurationSchema(featureFlags)),
      ...channelSchemas,
    },
  })
}

export function createDownlinkResetToFactorySchema() {
  return v.object({
    deviceAction: v.literal('resetToFactory'),
  })
}

export function createDownlinkResetBatteryIndicatorSchema(featureFlags: Tulip2EncodeFeatureFlags) {
  const createActionSchema = createTULIP2DownlinkActionSchemaFactory(featureFlags.maxConfigId)
  return createActionSchema({
    action: 'resetBatteryIndicator',
    meta: {
      byteLimit: false,
    },
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
    createTULIP2DownlinkConfigurationActionSchema(channels, featureFlags, spanLimitFactors),
    ...(extraActions ?? []),
  ])
}

type DownlinkResetToFactory = v.InferOutput<ReturnType<typeof createDownlinkResetToFactorySchema>>

// necessary as InferOutput from valibot has strict inputs and with dynamic schemas it gets confused
// Note: `| undefined` in the value type is required for exactOptionalPropertyTypes compatibility,
// as Valibot declares `~types` as `{ output: T } | undefined`.
type InferValibotOutput<TSchema> = TSchema extends { '~types'?: { output: infer TOutput } | undefined }
  ? TOutput
  : never

export type TULIP2ConfigurationAction<TChannels extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags>
  = InferValibotOutput<ReturnType<typeof createTULIP2DownlinkConfigurationActionSchema<TChannels, TFeatureFlags>>>

export type TULIP2DownlinkInput<TChannels extends TULIP2Channel, TFeatureFlags extends Tulip2EncodeFeatureFlags>
  = DownlinkResetToFactory
    | TULIP2ConfigurationAction<TChannels, TFeatureFlags>

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
