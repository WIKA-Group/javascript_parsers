import type { UplinkInput } from '../../schemas'
import type { TULIP3UplinkOutput } from '../../schemas/tulip3'
import type { TULIP3DownlinkActionMultiple, TULIP3DownlinkActionSingle } from '../../schemas/tulip3/downlink'
import type { Channel, DownlinkOutput, GenericUplinkOutput, MultipleDownlinkOutput } from '../../types'
import type { Codec } from '../codec'
import type { TULIP3ChannelConfig, TULIP3DeviceConfig, TULIP3DeviceProfile, TULIP3SensorConfig } from './profile'

import { getRoundingDecimals } from '../../utils'
import { TULIP3_PROTOCOL } from '../protocols'
import { checkChannelsValidity } from '../utils'
import { createMultipleEncoderFactory } from './encoder/encode'
import { readMessageSubtype } from './messages'
import { createDecodeConfigurationRegisterRead, decodeConfigurationRegisterWrite } from './messages/configuration'
import { decodeDataMessage } from './messages/data'
import { decodeChannelAlarmMessage, decodeCommunicationModuleAlarmMessage, decodeSensorAlarmMessage } from './messages/deviceAlarm'
import { createDecodeIdentificationRegisterRead, decodeIdentificationRegisterWrite } from './messages/identification'
import { decodeKeepAliveMessage } from './messages/keepAlive'
import { decodeProcessAlarmMessage } from './messages/processAlarm'
import { decodeSpontaneousFetchAdditionalDownlinkMessageMessage, decodeSpontaneousGenericDownlinkAnswerMessage } from './messages/spontaneous'

type ChannelNames<TTULIP3DeviceConfig extends TULIP3DeviceConfig> = {
  [S in keyof TTULIP3DeviceConfig]: TTULIP3DeviceConfig[S] extends TULIP3SensorConfig ? {
    [C in keyof TTULIP3DeviceConfig[S]]: TTULIP3DeviceConfig[S][C] extends TULIP3ChannelConfig ? TTULIP3DeviceConfig[S][C]['adjustMeasurementRangeDisallowed'] extends true ? never : TTULIP3DeviceConfig[S][C]['channelName'] : never
  }[keyof TTULIP3DeviceConfig[S]] : never
}[keyof TTULIP3DeviceConfig]

/**
 * Type alias for a TULIP3 codec with protocol identification.
 * Wrapper around base Codec type that fixes the protocol to TULIP3 and passes through all other type parameters.
 */
export type TULIP3Codec<
  TCodecName extends string,
  TData extends GenericUplinkOutput,
  TChannelName extends string | never,
  TEncoder extends (((input: any) => DownlinkOutput) | undefined) = undefined,
  TMultipleEncoder extends (((input: any) => MultipleDownlinkOutput) | undefined) = undefined,
> = Codec<typeof TULIP3_PROTOCOL, TCodecName, TData, TChannelName, TEncoder, TMultipleEncoder>

/**
 * Creates a TULIP3 protocol codec for decoding advanced IoT device messages with comprehensive sensor support.
 *
 * TULIP3 is an enhanced protocol that supports multiple message types (0x10-0x17) with sub-types,
 * providing sophisticated handling for data messages, alarms, configuration, identification, and more.
 * Unlike TULIP2, TULIP3 uses a device profile configuration approach with sensor-based channel organization.
 *
 * @param deviceProfile - Complete device profile configuration object, see {@link TULIP3DeviceProfile}
 *
 * @returns A fully configured TULIP3 codec capable of handling all TULIP3 message types
 *
 * @throws {Error} When channel names are duplicated across sensors
 * @throws {Error} When channel ranges are invalid (start >= end)
 * @throws {RangeError} When input bytes are insufficient for message type
 * @throws {Error} When unsupported message types or sub-types are encountered
 *
 * @example
 * ```typescript
 * // Create a device profile with sensor configuration
 * const createDeviceProfile = () => ({
 *   deviceName: 'PressureSensor',
 *   roundingDecimals: 2,
 *   identificationMessageMaxRegisterSize: 64,
 *   configurationMessageMaxRegisterSize: 32,
 *   sensorChannelConfig: {
 *     sensor1: {
 *       channel1: {
 *         channelName: 'pressure',
 *         start: 0,
 *         end: 1000,
 *         unit: 'bar'
 *       }
 *     }
 *   },
 *   deviceAlarmConfig: {
 *     communicationModuleAlarms: {...},
 *     sensorAlarms: {...},
 *     sensorChannelAlarms: {...}
 *   }
 * } as const);
 *
 * // Create TULIP3 codec
 * const codec = defineTULIP3Codec(createDeviceProfile());
 *
 * // Decode a data message (0x10/0x11)
 * const result = codec.decode({ bytes: [0x10, 0x01, ...], fPort: 1 });
 * ```
 *
 * **Supported Message Types:**
 * - `0x10/0x11` - Data messages with sensor readings
 * - `0x12` - Process alarm messages
 * - `0x13` - Device alarm messages (communication, sensor, channel)
 * - `0x14` - Identification register read/write
 * - `0x15` - Configuration register read/write
 * - `0x16` - Keep-alive messages
 * - `0x17` - Spontaneous messages (downlink answers, fetch requests)
 *
 * @warning **ANTI-PATTERN**: Do not reuse the same device profile object reference across multiple codec instances.
 * The device profile's sensor channel configurations are mutated when `adjustMeasuringRange` is called,
 * which can cause unexpected behavior when multiple parsers share the same profile reference.
 * Always create fresh device profile objects for each codec instance to avoid channel pollution:
 *
 * ```typescript
 * // ❌ WRONG - Reusing device profile reference
 * const sharedProfile = { deviceName: 'Device', sensorChannelConfig: {...}, ... };
 * const codec1 = defineTULIP3Codec(sharedProfile);
 * const codec2 = defineTULIP3Codec(sharedProfile); // Will share mutations!
 *
 * // ✅ CORRECT - Fresh device profiles
 * const codec1 = defineTULIP3Codec({
 *   deviceName: 'Device1',
 *   sensorChannelConfig: { sensor1: { ch1: {...} } },
 *   ...
 * });
 * const codec2 = defineTULIP3Codec({
 *   deviceName: 'Device2',
 *   sensorChannelConfig: { sensor1: { ch1: {...} } },
 *   ...
 * });
 * ```
 *
 * @see {@link TULIP3DeviceProfile} for complete device profile interface
 * @see {@link TULIP3UplinkOutput} for output type definitions
 * @see {@link TULIP3ChannelConfig} for channel configuration interface
 */
export function defineTULIP3Codec<const TDeviceProfile extends TULIP3DeviceProfile>(deviceProfile: TDeviceProfile): TULIP3Codec<
  `${TDeviceProfile['deviceName']}TULIP3Codec`,
  TULIP3UplinkOutput<TDeviceProfile>,
  ChannelNames<TDeviceProfile['sensorChannelConfig']>,
  (input: TULIP3DownlinkActionSingle<TDeviceProfile['sensorChannelConfig']>) => DownlinkOutput,
  (input: TULIP3DownlinkActionMultiple<TDeviceProfile['sensorChannelConfig']>) => MultipleDownlinkOutput
> {
  const name = `${deviceProfile.deviceName}TULIP3Codec` as `${TDeviceProfile['deviceName']}TULIP3Codec`
  let roundingDecimals = getRoundingDecimals(deviceProfile.roundingDecimals)

  // Create decoders once with register lookups
  const decodeIdentification = createDecodeIdentificationRegisterRead(deviceProfile.sensorChannelConfig)
  const decodeConfiguration = createDecodeConfigurationRegisterRead(deviceProfile.sensorChannelConfig)

  function getChannels(): Channel[] {
    const c: Channel[] = []
    Object.keys(deviceProfile.sensorChannelConfig).forEach((sensorKey) => {
      // skip if it does not start with 'sensor'
      if (!sensorKey.startsWith('sensor'))
        return
      const sensorConfig = (deviceProfile.sensorChannelConfig as any)[sensorKey] as TULIP3SensorConfig
      Object.keys(sensorConfig).forEach((channelKey) => {
        // skip if it does not start with 'channel'
        if (!channelKey.startsWith('channel'))
          return
        const channelConfig = sensorConfig[channelKey as keyof typeof sensorConfig] as TULIP3ChannelConfig
        c.push({
          name: channelConfig.channelName,
          start: channelConfig.start,
          end: channelConfig.end,
          ...(channelConfig.adjustMeasurementRangeDisallowed === true ? { adjustMeasurementRangeDisallowed: true as const } : {}),
        })
      })
    })

    return c
  }

  // check if the channels are valid
  checkChannelsValidity(getChannels(), name)

  function canTryDecode(input: UplinkInput): boolean {
    // can try if the bytes start with 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16 and 0x17
    if (input.bytes.length < 2)
      return false
    const prefix = input.bytes[0]!
    return prefix >= 0x10 && prefix <= 0x17
  }

  function decode(input: UplinkInput): TULIP3UplinkOutput<TDeviceProfile> {
    if (input.bytes.length < 2) {
      throw new RangeError(`Invalid input length. Expected at least 2 bytes but got ${input.bytes.length}`)
    }

    const firstByte = input.bytes[0]
    const subType = readMessageSubtype(input.bytes[1]!)

    switch (firstByte) {
      case 0x10:
      case 0x11:
        // @ts-expect-error - ts cannot infer the correct return type here
        return decodeDataMessage(input.bytes, deviceProfile.sensorChannelConfig, roundingDecimals)
      case 0x12:
        // @ts-expect-error - ts cannot infer the correct return type here

        return decodeProcessAlarmMessage(input.bytes, deviceProfile.sensorChannelConfig)
      case 0x13:
        switch (subType) {
          case 0x01:
            return decodeCommunicationModuleAlarmMessage(input.bytes, deviceProfile.sensorChannelConfig)
          case 0x02:
            // @ts-expect-error - ts cannot infer the correct return type here
            return decodeSensorAlarmMessage(input.bytes, deviceProfile.sensorChannelConfig)
          case 0x03:
            return decodeChannelAlarmMessage(input.bytes, deviceProfile.sensorChannelConfig)
          default:
            throw new Error(`Unsupported sub message type 0x${subType?.toString(16)} for message type 0x13`)
        }
      case 0x14:
        switch (subType) {
          case 0x01:
          case 0x02:
          case 0x04:
            // @ts-expect-error - ts cannot infer the correct return type here
            return decodeIdentification(input.bytes)
          case 0x03:
            return decodeIdentificationRegisterWrite(input.bytes)
          default:
            throw new Error(`Unsupported sub message type 0x${subType?.toString(16)} for message type 0x14`)
        }
      case 0x15:
        switch (subType) {
          case 0x01:
          case 0x02:
            // @ts-expect-error - ts cannot infer the correct return type here
            return decodeConfiguration(input.bytes)
          case 0x03:
            return decodeConfigurationRegisterWrite(input.bytes)
          default:
            throw new Error(`Unsupported sub message type 0x${subType?.toString(16)} for message type 0x15`)
        }
      case 0x16:
        return decodeKeepAliveMessage(input.bytes)
      case 0x17:
        switch (subType) {
          case 0x01:
            return decodeSpontaneousGenericDownlinkAnswerMessage(input.bytes)
          case 0x02:
            return decodeSpontaneousFetchAdditionalDownlinkMessageMessage(input.bytes)
          default:
            throw new Error(`Unsupported sub message type 0x${subType?.toString(16)} for message type 0x17`)
        }
      default:
        throw new Error(`Unsupported message type 0x${firstByte?.toString(16)}`)
    }
  }

  // Create encodeMultiple once and reuse it
  const encodeMultiple = createMultipleEncoderFactory(deviceProfile)

  return {
    name,
    protocol: TULIP3_PROTOCOL,
    adjustMeasuringRange: (name, range) => {
      const sensorConfigs = Object.values(deviceProfile.sensorChannelConfig) as TULIP3SensorConfig[]
      for (const sensorConfig of sensorConfigs) {
        const channel = Object.values(sensorConfig).find((channel: TULIP3ChannelConfig) => channel?.channelName === name) as TULIP3ChannelConfig
        if (channel) {
          channel.start = range.start
          channel.end = range.end
          return
        }
      }
    },
    canTryDecode,
    getChannels,
    adjustRoundingDecimals: (decimals: number) => {
      roundingDecimals = getRoundingDecimals(decimals, roundingDecimals)
    },
    decode,
    encode: ((input: TULIP3DownlinkActionMultiple<TDeviceProfile['sensorChannelConfig']>): DownlinkOutput => {
      // Delegate to multiple encoder
      const multiResult = encodeMultiple(input as any)

      // If error, return as-is
      if ('errors' in multiResult) {
        return multiResult as any
      }

      // Validate single frame
      if (multiResult.frames.length > 1) {
        return {
          errors: [
            `Encoding produced ${multiResult.frames.length} frames but single encoder can only return one frame. `
            + 'Use encodeMultiple() or call encode() separately for identification and configuration, '
            + 'or increase byteLimit.',
          ],
        }
      }

      // Convert to single output format
      return {
        fPort: multiResult.fPort,
        bytes: multiResult.frames[0]!,
      }
    }) as (input: TULIP3DownlinkActionSingle<TDeviceProfile['sensorChannelConfig']>) => DownlinkOutput,

    encodeMultiple: encodeMultiple as (input: TULIP3DownlinkActionMultiple<TDeviceProfile['sensorChannelConfig']>) => MultipleDownlinkOutput,
  }
}
