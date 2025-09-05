import type { UplinkInput } from '../../schemas'
import type { TULIP3UplinkOutput } from '../../schemas/tulip3'
import type { Channel } from '../../types'
import type { Codec } from '../codec'
import type { TULIP3ChannelConfig, TULIP3DeviceProfile, TULIP3DeviceSensorConfig, TULIP3SensorChannelConfig } from './profile'
import { getRoundingDecimals } from '../../utils'
import { checkChannelsValidity } from '../utils'
import { readMessageSubtype } from './messages'
import { decodeConfigurationRegisterRead, decodeConfigurationRegisterWrite } from './messages/configuration'
import { decodeDataMessage } from './messages/data'
import { decodeChannelAlarmMessage, decodeCommunicationModuleAlarmMessage, decodeSensorAlarmMessage } from './messages/deviceAlarm'
import { decodeIdentificationRegisterRead, decodeIdentificationRegisterWrite } from './messages/identification'
import { decodeKeepAliveMessage } from './messages/keepAlive'
import { decodeProcessAlarmMessage } from './messages/processAlarm'
import { decodeSpontaneousFetchAdditionalDownlinkMessageMessage, decodeSpontaneousGenericDownlinkAnswerMessage } from './messages/spontaneous'

type ChannelNames<TTULIP3DeviceSensorConfig extends TULIP3DeviceSensorConfig> = {
  [S in keyof TTULIP3DeviceSensorConfig]: TTULIP3DeviceSensorConfig[S] extends TULIP3SensorChannelConfig ? {
    [C in keyof TTULIP3DeviceSensorConfig[S]]: TTULIP3DeviceSensorConfig[S][C] extends TULIP3ChannelConfig ? TTULIP3DeviceSensorConfig[S][C]['channelName'] : never
  }[keyof TTULIP3DeviceSensorConfig[S]] : never
}[keyof TTULIP3DeviceSensorConfig]

export function defineTULIP3Codec<const TDeviceProfile extends TULIP3DeviceProfile>(deviceProfile: TDeviceProfile): Codec<`${TDeviceProfile['deviceName']}TULIP3Codec`, TULIP3UplinkOutput<TDeviceProfile>, ChannelNames<TDeviceProfile['sensorChannelConfig']>> {
  const name = `${deviceProfile.deviceName}TULIP3Codec` as `${TDeviceProfile['deviceName']}TULIP3Codec`
  let roundingDecimals = getRoundingDecimals(deviceProfile.roundingDecimals)

  function getChannels(): Channel[] {
    const c: Channel[] = []
    Object.values(deviceProfile.sensorChannelConfig).forEach((sensorConfig: TULIP3SensorChannelConfig) => {
      Object.values(sensorConfig).forEach((channelConfig: TULIP3ChannelConfig) => {
        c.push({
          name: channelConfig.channelName,
          start: channelConfig.start,
          end: channelConfig.end,
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
        // @ts-expect-error - type is not correctly inferred due to default generic type in deviceProfile
        return decodeDataMessage(input.bytes, deviceProfile.sensorChannelConfig, roundingDecimals)
      case 0x12:
        // @ts-expect-error - type is not correctly inferred due to default generic type in deviceProfile
        return decodeProcessAlarmMessage(input.bytes, deviceProfile.sensorChannelConfig)
      case 0x13:
        switch (subType) {
          case 0x01:
            // @ts-expect-error - type is not correctly inferred due to default generic type in deviceProfile
            return decodeCommunicationModuleAlarmMessage(input.bytes, deviceProfile.deviceAlarmConfig.communicationModuleAlarms)
          case 0x02:
            // @ts-expect-error - type is not correctly inferred due to default generic type in deviceProfile
            return decodeSensorAlarmMessage(input.bytes, deviceProfile.sensorChannelConfig, deviceProfile.deviceAlarmConfig.sensorAlarms)
          case 0x03:
            // @ts-expect-error - type is not correctly inferred due to default generic type in deviceProfile
            return decodeChannelAlarmMessage(input.bytes, deviceProfile.sensorChannelConfig, deviceProfile.deviceAlarmConfig.sensorChannelAlarms)
          default:
            throw new Error(`Unsupported sub message type 0x${subType?.toString(16)} for message type 0x13`)
        }
      case 0x14:
        switch (subType) {
          case 0x01:
          case 0x02:
          case 0x04:
            // @ts-expect-error - type is not correctly inferred due to default generic type in deviceProfile
            return decodeIdentificationRegisterRead(input.bytes, deviceProfile.sensorChannelConfig, { maxRegisterSize: deviceProfile.identificationMessageMaxRegisterSize })
          case 0x03:
            return decodeIdentificationRegisterWrite(input.bytes)
          default:
            throw new Error(`Unsupported sub message type 0x${subType?.toString(16)} for message type 0x14`)
        }
      case 0x15:
        switch (subType) {
          case 0x01:
          case 0x02:
            // @ts-expect-error - type is not correctly inferred due to default generic type in deviceProfile
            return decodeConfigurationRegisterRead(input.bytes, deviceProfile.sensorChannelConfig, { maxRegisterSize: deviceProfile.configurationMessageMaxRegisterSize })
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

  return {
    name,
    adjustMeasuringRange: (name, range) => {
      const sensorConfigs = Object.values(deviceProfile.sensorChannelConfig) as TULIP3SensorChannelConfig[]
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
  }
}
