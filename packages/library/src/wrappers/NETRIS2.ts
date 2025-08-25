import type {
  DownlinkInput,
  DownlinkOutput,
} from '../../../parsers/src/devices/NETRIS2/schemas'
import type { DownlinkOutputSuccessful } from '../../../parsers/src/shared'
import type { Frame } from '../shared'
import
useParser
  from '../../../parsers/src/devices/NETRIS2/parser'
import { concatFrames } from '../shared'

type DownlinkActions = Extract<DownlinkInput, { deviceAction: 'resetToFactory' | 'resetBatteryIndicator' }>

type StartUpTimeConfig = Required<Extract<DownlinkInput, { deviceAction: 'setStartUpTimeConfiguration' }>['configuration']>['channel0']

type MeasurementOffsetConfig = Required<Extract<DownlinkInput, { deviceAction: 'setMeasureOffsetConfiguration' }>['configuration']>['channel0']

type ChannelConfig = (Required<Extract<DownlinkInput, { deviceAction: 'setProcessAlarmConfiguration' }>['configuration']>['channel0']) & Partial<StartUpTimeConfig>
  & Partial<MeasurementOffsetConfig>

type MainConfig = Required<Extract<DownlinkInput, { deviceAction: 'setMainConfiguration' }>['configuration']>
interface DownlinkConfigurationFrame {
  deviceAction: 'downlinkConfiguration'
  configurationId?: number
  /**
   * @deprecated This field is deprecated and will be removed in the future. Use `configurationId` instead.
   */
  transactionId?: number
  /**
   * The spreading factor to use.
   * By default assumes the worst case scenario (SF12 = 51 bytes per message).
   * @default 'SF12'
   * @preserve
   */
  spreadingFactor?: keyof typeof spreadingFactorLookUp
  configuration: {
    mainConfiguration?: MainConfig
    channel0?: boolean | ChannelConfig
    channel1?: boolean | ChannelConfig
  }
}

export type NETRIS2DownlinkInput = DownlinkActions | DownlinkConfigurationFrame

export type NETRIS2DownlinkOutput = {
  success: true
  data: {
    frames: Frame[]
  }
  errors?: undefined
} | {
  success: false
  data?: undefined
  errors: string[]
}

// eslint-disable-next-line ts/explicit-function-return-type
function getNecessaryFrames(input: DownlinkConfigurationFrame) {
  const channel0StartUpTimeNecessary = typeof input.configuration.channel0 === 'object' ? input.configuration.channel0.startUpTime !== undefined : false
  const channel0OffsetNecessary = typeof input.configuration.channel0 === 'object' ? input.configuration.channel0.measureOffset !== undefined : false

  const channel1StartUpTimeNecessary = typeof input.configuration.channel1 === 'object' ? input.configuration.channel1.startUpTime !== undefined : false
  const channel1OffsetNecessary = typeof input.configuration.channel1 === 'object' ? input.configuration.channel1.measureOffset !== undefined : false

  type Configuration = 'disabled' | 'enabled' | 'configured' | 'none'

  const channel0Configuration: Configuration = input.configuration.channel0 === undefined ? 'none' : input.configuration.channel0 === false ? 'disabled' : input.configuration.channel0 === true ? 'enabled' : 'configured'
  const channel1Configuration: Configuration = input.configuration.channel1 === undefined ? 'none' : input.configuration.channel1 === false ? 'disabled' : input.configuration.channel1 === true ? 'enabled' : 'configured'

  const channel0Disabled = input.configuration.channel0 === false
  const channel1Disabled = input.configuration.channel1 === false

  const isMainConfigurationNecessary = !!input.configuration.mainConfiguration

  return {
    channel0StartUpTimeNecessary,
    channel0OffsetNecessary,
    channel1StartUpTimeNecessary,
    channel1OffsetNecessary,
    channel1Configuration,
    channel0Configuration,
    channel0Disabled,
    channel1Disabled,
    isMainConfigurationNecessary,
  }
}

/**
 * Used to look up the amount of bytes per message for a given spreading factor.
 */
const spreadingFactorLookUp = {
  SF7: 222,
  7: 222,
  SF8: 222,
  8: 222,
  SF9: 115,
  9: 115,
  SF10: 51,
  10: 51,
  SF11: 51,
  11: 51,
  SF12: 51,
  12: 51,
} as const

// eslint-disable-next-line ts/explicit-function-return-type
export function NETRIS2Parser() {
  const {
    adjustRoundingDecimals,
    decodeUplink,
    decodeHexUplink,
    ...parser
  } = useParser()

  function encodeMainConfiguration(input: DownlinkConfigurationFrame, necessaryFrames: ReturnType<typeof getNecessaryFrames>): DownlinkOutput | null {
    if (!necessaryFrames.isMainConfigurationNecessary)
      return null
    return parser.encodeDownlink({
      deviceAction: 'setMainConfiguration',
      configuration: input.configuration.mainConfiguration!,
    })
  }

  function encodeStartUpTimeFrame(input: DownlinkConfigurationFrame, necessaryFrames: ReturnType<typeof getNecessaryFrames>): DownlinkOutput | null {
    if (necessaryFrames.channel0StartUpTimeNecessary || necessaryFrames.channel1StartUpTimeNecessary) {
      return parser.encodeDownlink({
        deviceAction: 'setStartUpTimeConfiguration',
        configuration: {
          channel0: necessaryFrames.channel0StartUpTimeNecessary
            ? {
                startUpTime: (input.configuration.channel0 as ChannelConfig).startUpTime!,
              }
            : undefined,
          channel1: necessaryFrames.channel1StartUpTimeNecessary
            ? {
                startUpTime: (input.configuration.channel1 as ChannelConfig).startUpTime!,
              }
            : undefined,
        },
      })
    }
    return null
  }

  function encodeOffsetFrame(input: DownlinkConfigurationFrame, necessaryFrames: ReturnType<typeof getNecessaryFrames>): DownlinkOutput | null {
    if (necessaryFrames.channel0OffsetNecessary || necessaryFrames.channel1OffsetNecessary) {
      return parser.encodeDownlink({
        deviceAction: 'setMeasureOffsetConfiguration',
        configuration: {
          ...(necessaryFrames.channel0OffsetNecessary
            ? {
                channel0: {
                  measureOffset: (input.configuration.channel0 as ChannelConfig).measureOffset!,
                },
              }
            : {}),
          ...(necessaryFrames.channel1OffsetNecessary
            ? {
                channel1: {
                  measureOffset: (input.configuration.channel1 as ChannelConfig).measureOffset!,
                },
              }
            : {}),
        },
      })
    }
    return null
  }

  function encodeDisableChannelFrame(necessaryFrames: ReturnType<typeof getNecessaryFrames>): DownlinkOutput | null {
    if (necessaryFrames.channel0Disabled || necessaryFrames.channel1Disabled) {
      return parser.encodeDownlink({
        deviceAction: 'disableChannel',
        configuration: {
          channel0: necessaryFrames.channel0Disabled === true
            ? {
                disable: true,
              }
            : undefined,
          channel1: necessaryFrames.channel1Disabled === true
            ? {
                disable: true,
              }
            : undefined,
        },
      })
    }
    return null
  }

  function encodeConfigurationFrame(input: DownlinkConfigurationFrame, necessaryFrames: ReturnType<typeof getNecessaryFrames>): DownlinkOutput | null {
    // check if both are either disabled or none
    const isChannel0DisabledOrNone = necessaryFrames.channel0Configuration === 'disabled' || necessaryFrames.channel0Configuration === 'none'
    const isChannel1DisabledOrNone = necessaryFrames.channel1Configuration === 'disabled' || necessaryFrames.channel1Configuration === 'none'
    if (isChannel0DisabledOrNone && isChannel1DisabledOrNone) {
      return null
    }
    return parser.encodeDownlink({
      deviceAction: 'setProcessAlarmConfiguration',
      configuration: {
        channel0: necessaryFrames.channel0Configuration === 'disabled' || necessaryFrames.channel0Configuration === 'none'
          ? undefined
          : necessaryFrames.channel0Configuration === 'enabled'
            ? { deadBand: 0 }
            : input.configuration.channel0 as ChannelConfig,
        channel1: necessaryFrames.channel1Configuration === 'disabled' || necessaryFrames.channel0Configuration === 'none'
          ? undefined
          : necessaryFrames.channel1Configuration === 'enabled'
            ? { deadBand: 0 }
            : input.configuration.channel1 as ChannelConfig,
      },
    })
  }

  /**
   * Encodes the downlink input.
   * @param input The downlink input.
   * @returns An object with frames and optional errors.
   */
  function encodeDownlink(input: NETRIS2DownlinkInput): NETRIS2DownlinkOutput {
    switch (input.deviceAction) {
      case 'resetToFactory':
      case 'resetBatteryIndicator': {
        const res = parser.encodeDownlink(input)
        if ('errors' in res) {
          return { success: false, errors: res.errors }
        }
        return { success: true, data: { frames: [res.bytes] } }
      }
      case 'downlinkConfiguration': {
        const byteLimit = spreadingFactorLookUp[input.spreadingFactor ?? 'SF12']

        const necessaryFrames = getNecessaryFrames(input)

        const startUpTimeFrame = encodeStartUpTimeFrame(input, necessaryFrames)
        const offSetFrame = encodeOffsetFrame(input, necessaryFrames)
        const disableChannelFrame = encodeDisableChannelFrame(necessaryFrames)
        const configurationFrame = encodeConfigurationFrame(input, necessaryFrames)
        const mainConfiguration = encodeMainConfiguration(input, necessaryFrames)

        const frames = [mainConfiguration, disableChannelFrame, configurationFrame, offSetFrame, startUpTimeFrame].filter(frame => frame !== null)

        const errors = frames.map(frame => 'errors' in frame ? frame.errors : []).flat()
        if (errors.length > 0) {
          return { success: false, errors }
        }

        // concat the frames
        return {
          success: true,
          data: {
            frames: concatFrames(frames.map(frame => (frame as DownlinkOutputSuccessful).bytes), byteLimit, input.configurationId ?? input.transactionId ?? 1, 31),
          },
        }
      }
      default:
        return { success: false, errors: [`Unknown device action: ${(input as NETRIS2DownlinkInput).deviceAction}`] }
    }
  }

  return {
    encodeDownlink,
    decodeUplink,
    decodeHexUplink,
    adjustRoundingDecimals,
  }
}
