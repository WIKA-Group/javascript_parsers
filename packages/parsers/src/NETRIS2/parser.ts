import type {
  UplinkInput,
} from '../shared'

import type {
  ChannelMeasurement,
  ChannelTechnicalAlarmData,
  DownlinkInput,
  DownlinkOutput,
  OutputError,
  OutputFailure,
  OutputWarning,
  UplinkOutput,
  UplinkOutputSuccessfulConfigurationStatus,
  UplinkOutputSuccessfulKeepAlive,
  UplinkOutputSuccessfulMeasurements,
  UplinkOutputSuccessfulProcessAlarms,
  UplinkOutputSuccessfulRadioUnitIdentification,
  UplinkOutputSuccessfulTechnicalAlarms,
} from './schemas'

import * as v from 'valibot'

import { hexStringToIntArray, numberToIntArray, useBaseParser } from '../shared'

import {
  ALARM_EVENT_NAMES_DICTIONARY,
  CONFIGURATION_STATUS_NAMES_DICTIONARY,
  PROCESS_ALARM_TYPE_NAMES_DICTIONARY,
  TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY,
} from './constants'

// eslint-disable-next-line ts/explicit-function-return-type
export default function useParser() {
  /**
   * ! These ranges are always 4 ma - 20 ma according to the NETRIS2 device specification. Changing these values will result in incorrect decoding.
   */

  const {
    validateUplinkInput,
    createErrorMessage,
    addWarningMessages,
    createChannelData,
    checkSemVerVersions,
    getRealSlopeValue,
    getRealMeasurementValue,
    adjustRoundingDecimals,
  } = useBaseParser({
    deviceName: 'NETRIS2',
    channels: [
      {
        start: 4,
        end: 20,
        name: 'Electrical current',
      },
      {
        start: 4,
        end: 20,
        name: 'Electrical current',
      },
    ],
  })

  // ***********************************************************************************
  // Public Decoding Section
  // ***********************************************************************************

  function decodeUplink(input: UplinkInput): UplinkOutput {
    return decode(input)
  }

  function decodeHexUplink(input: Omit<UplinkInput, 'bytes'> & { bytes: unknown }): UplinkOutput {
    // First, validate input is an object with a `bytes` property using valibot
    const inputSchema = v.object({
      bytes: v.unknown(),
    })

    const inputParseResult = v.safeParse(inputSchema, input)
    if (!inputParseResult.success) {
      return createErrorMessage(['Input must be an object with a `bytes` property'])
    }

    // Now validate the bytes property itself
    const bytesSchema = v.union([
      v.string('Input `bytes` must be a hex string'),
    ])

    const parseResult = v.safeParse(bytesSchema, inputParseResult.output.bytes)
    if (!parseResult.success) {
      return createErrorMessage(['`bytes` must either be a hex string or an array of hex strings'])
    }

    const intArray = hexStringToIntArray(parseResult.output)

    if (!intArray) {
      return createErrorMessage([
        `Invalid hex string: ${inputParseResult.output.bytes}`,
      ])
    }

    return decodeUplink({
      ...input,
      bytes: intArray,
    })
  }

  function encodeDownlink(input: DownlinkInput): DownlinkOutput {
    return encode(input)
  }

  // ***********************************************************************************
  // Private Decoding Section
  // ***********************************************************************************

  //
  // Uplink
  //

  function decode(input: UplinkInput): UplinkOutput {
    // Validate input
    const validationResult = validateUplinkInput(input)
    if ('errors' in validationResult) {
      return validationResult
    }

    input = validationResult

    const firstByte = input.bytes[0]

    switch (firstByte) {
      // Data message with no alarm ongoing
      case 0x01:
        return decodeDataMessage(input)

        // Data message with at least one alarm ongoing
      case 0x02:
        return decodeDataMessage(input)

        // Process alarm message
      case 0x03:
        return decodeProcessAlarmMessage(input)

        // Technical alarm message
      case 0x04:
        return decodeTechnicalAlarmMessage(input)

        // Configuration status message
      case 0x06:
        return decodeConfigurationStatusMessage(input)

        // Radio unit identification message
      case 0x07:
        return decodeRadioUnitIdentificationMessage(input)

        // Keep alive message
      case 0x08:
        return decodeKeepAliveMessage(input)
        // Unsupported message type
      default:
        return createErrorMessage([
          `Data message type ${firstByte} is not supported`,
        ])
    }
  }

  function decodeDataMessage(
    input: UplinkInput,
  ): UplinkOutputSuccessfulMeasurements | OutputFailure {
    const minLengthForData = 5
    const maxLengthForData = 7

    const warnings: OutputWarning[] = []

    const [haschannel0, haschannel1, overflows] = [
      input.bytes.length >= minLengthForData,
      input.bytes.length >= maxLengthForData,
      input.bytes.length > maxLengthForData,
    ]

    if (!haschannel0) {
      return createErrorMessage([
        `Data message${
          input.bytes[0] ? ` ${input.bytes[0]}` : ''
        } must contain at least ${minLengthForData} bytes. Contains ${input.bytes.length} bytes.`,
      ])
    }
    if (!haschannel1) {
      // valid that no channel 2 is present
      /* addWarningMessages(warnings, [
  `Data message must contain ${maxLengthForData} bytes to channel 2. Contains ${input.bytes.length} bytes.`,
  ]) */
    }
    if (overflows) {
      addWarningMessages(warnings, [
        `Data message contains more than ${maxLengthForData} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
      ])
    }

    const messageType = input.bytes[0]! as 0x01 | 0x02
    const configurationId = input.bytes[1]!
    const channelMask = input.bytes[2]!
    const isChannelMaskValid = [0x00, 0x01, 0x02, 0x03].includes(
      channelMask,
    )

    if (!isChannelMaskValid) {
      return createErrorMessage([
        `Data message contains an invalid channel mask: ${channelMask}, expected 0x00, 0x01, 0x02 or 0x03`,
      ])
    }

    const [channel0Valid, channel1Valid] = [
      channelMask & 0x01,
      channelMask & 0x02,
    ]

    const channelData: ChannelMeasurement[] = []

    if (haschannel0 && channel0Valid) {
      const measurementValue = (input.bytes[3]! << 8) | input.bytes[4]!
      const data = createChannelData(0, measurementValue)
      if (typeof data === 'string') {
        return createErrorMessage([data])
      }
      channelData.push(data)
    }
    if (haschannel1 && channel1Valid) {
      const measurementValue = (input.bytes[5]! << 8) | input.bytes[6]!
      const data = createChannelData(1, measurementValue)
      if (typeof data === 'string') {
        return createErrorMessage([data])
      }
      channelData.push(data)
    }

    if (channelData.length !== 1 && channelData.length !== 2) {
      return createErrorMessage([
        `Invalid number of channels: ${channelData.length}`,
      ])
    }

    const res: UplinkOutputSuccessfulMeasurements = {
      data: {
        messageType,
        configurationId,
        measurements: {
          channels: channelData as [ChannelMeasurement] | [
            ChannelMeasurement,
            ChannelMeasurement,
          ],
        },
      },
    }

    if (warnings.length > 0) {
      res.warnings = warnings
    }

    return res
  }

  function decodeProcessAlarmMessage(
    input: UplinkInput,
  ): UplinkOutputSuccessfulProcessAlarms | OutputFailure {
    const minLengthBytes = 6

    if (input.bytes.length < minLengthBytes) {
      return createErrorMessage([
        `Process alarm message must contain at least ${minLengthBytes} bytes. Contains ${input.bytes.length} bytes.`,
      ])
    }
    // bytes must have a length of 6, 9, 12, ... (3n + 6)
    if (input.bytes.length % 3 !== 0) {
      return createErrorMessage([
        `Process alarm message must contain a multiple of 3 bytes.`,
      ])
    }

    const messageType = input.bytes[0]! as 0x03
    const configurationId = input.bytes[1]!
    // 3rd byte is reserved

    // get every alarm entry that is 3 bytes long but ignore the first 3 bytes
    const processAlarms:
    UplinkOutputSuccessfulProcessAlarms['data']['processAlarms'] = []
    for (let i = 3; i < input.bytes.length; i += 3) {
      const alarmTypeByte = input.bytes[i]!
      const processAlarmType = getProcessAlarmType(alarmTypeByte)
      if ('errors' in processAlarmType) {
        return processAlarmType
      }

      const processAlarmRelatedValue = getProcessAlarmRelatedValue(
        input.bytes[i + 1]!,
        input.bytes[i + 2]!,
        processAlarmType.channelId,
        processAlarmType.alarmType,
      )

      if (typeof processAlarmRelatedValue === 'string') {
        return createErrorMessage([processAlarmRelatedValue])
      }

      processAlarms.push({
        channelId: processAlarmType.channelId,
        channelName: `Electrical current`,
        alarmType: processAlarmType.alarmType,
        alarmTypeName: PROCESS_ALARM_TYPE_NAMES_DICTIONARY[
          processAlarmType.alarmType
        ]!,
        event: processAlarmType.sense,
        eventName: ALARM_EVENT_NAMES_DICTIONARY[processAlarmType.sense]!,
        value: processAlarmRelatedValue,
      })
    }

    return {
      data: {
        messageType,
        configurationId,
        processAlarms,
      },
    }
  }

  function decodeTechnicalAlarmMessage(
    input: UplinkInput,
  ): UplinkOutputSuccessfulTechnicalAlarms | OutputFailure {
    const minLengthBytes = 4
    const maxLengthBytes = 5

    const warnings: OutputWarning[] = []

    if (input.bytes.length < minLengthBytes) {
      return createErrorMessage([
        `Technical alarm message must contain at least ${minLengthBytes} bytes`,
      ])
    }

    if (input.bytes.length > maxLengthBytes) {
      addWarningMessages(warnings, [
        `Technical alarm message contains more than ${maxLengthBytes} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
      ])
    }

    const messageType = input.bytes[0]! as 0x04
    const configurationId = input.bytes[1]!
    const bitMask = input.bytes[2]!

    if (![0x01, 0x02, 0x03].includes(bitMask)) {
      return createErrorMessage([
        `Technical alarm message contains an invalid bit mask: ${bitMask}, expected 0x01, 0x02 or 0x03`,
      ])
    }

    const requiredBitMaskLength = bitMask === 0x03 ? 5 : 4

    if (input.bytes.length < requiredBitMaskLength) {
      return createErrorMessage([
        `Technical alarm message with bit mask ${bitMask} must contain atleast ${requiredBitMaskLength} bytes. Contains ${input.bytes.length} bytes.`,
      ])
    }

    if (input.bytes.length > requiredBitMaskLength) {
      addWarningMessages(warnings, [
        `Technical alarm message with bit mask ${bitMask} contains more than ${requiredBitMaskLength} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
      ])
    }

    const technicalAlarms: ChannelTechnicalAlarmData[] = []

    switch (bitMask) {
      case 0x01: {
        const technicalAlarm = getTechnicalAlarmCauseOfFailure(
          input.bytes[3]!,
        )
        if ('errors' in technicalAlarm) {
          return technicalAlarm
        }

        technicalAlarms.push({
          channelId: 0,
          channelName: `Electrical current`,
          event: technicalAlarm.sense,
          eventName: ALARM_EVENT_NAMES_DICTIONARY[technicalAlarm.sense],
          causeOfFailure: technicalAlarm.causeOfFailure,
          causeOfFailureName: TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY[
            technicalAlarm.causeOfFailure
          ],
        })
        break
      }
      case 0x02: {
        const technicalAlarm = getTechnicalAlarmCauseOfFailure(
          input.bytes[3]!,
        )
        if ('errors' in technicalAlarm) {
          return technicalAlarm
        }

        technicalAlarms.push({
          channelId: 1,
          channelName: `Electrical current`,
          event: technicalAlarm.sense,
          eventName: ALARM_EVENT_NAMES_DICTIONARY[technicalAlarm.sense],
          causeOfFailure: technicalAlarm.causeOfFailure,
          causeOfFailureName: TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY[
            technicalAlarm.causeOfFailure
          ],
        })
        break
      }
      case 0x03: {
        const technicalAlarm1 = getTechnicalAlarmCauseOfFailure(
          input.bytes[3]!,
        )
        if ('errors' in technicalAlarm1) {
          return technicalAlarm1
        }

        const technicalAlarm2 = getTechnicalAlarmCauseOfFailure(
          input.bytes[4]!,
        )
        if ('errors' in technicalAlarm2) {
          return technicalAlarm2
        }

        technicalAlarms.push(
          {
            channelId: 0,
            channelName: `Electrical current`,
            event: technicalAlarm1.sense,
            eventName: ALARM_EVENT_NAMES_DICTIONARY[technicalAlarm1.sense],
            causeOfFailure: technicalAlarm1.causeOfFailure,
            causeOfFailureName:
              TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY[
                technicalAlarm1.causeOfFailure
              ],
          },
          {
            channelId: 1,
            channelName: `Electrical current`,
            event: technicalAlarm2.sense,
            eventName: ALARM_EVENT_NAMES_DICTIONARY[technicalAlarm2.sense],
            causeOfFailure: technicalAlarm2.causeOfFailure,
            causeOfFailureName:
              TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY[
                technicalAlarm2.causeOfFailure
              ],
          },
        )
        break
      }
    }

    const res: UplinkOutputSuccessfulTechnicalAlarms = {
      data: {
        messageType,
        configurationId,
        technicalAlarms,
      },
    }

    if (warnings.length > 0) {
      res.warnings = warnings
    }

    return res
  }

  function decodeConfigurationStatusMessage(
    input: UplinkInput,
  ): UplinkOutputSuccessfulConfigurationStatus | OutputFailure {
    const minLength = 3
    const validStatuses = [0x20, 0x30, 0x60, 0x70] as const

    const warnings: OutputWarning[] = []

    if (input.bytes.length < minLength) {
      return createErrorMessage([
        `Configuration status message must contain at least ${minLength} bytes. Contains ${input.bytes.length} bytes.`,
      ])
    }

    if (input.bytes.length > minLength) {
      addWarningMessages(warnings, [
        `Configuration status message contains more than ${minLength} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
      ])
    }

    const messageType = input.bytes[0]! as 0x06
    const configurationId = input.bytes[1]!
    const status = input
      .bytes[2]! as keyof typeof CONFIGURATION_STATUS_NAMES_DICTIONARY

    if (!validStatuses.includes(status)) {
      return createErrorMessage([
        `Configuration status message contains an invalid status: ${status}`,
      ])
    }

    const res: UplinkOutputSuccessfulConfigurationStatus = {
      data: {
        messageType,
        configurationId,
        configurationStatus: {
          statusId: status,
          status: CONFIGURATION_STATUS_NAMES_DICTIONARY[status],
        },
      },
    }

    if (warnings.length > 0) {
      res.warnings = warnings
    }

    return res
  }

  function decodeRadioUnitIdentificationMessage(
    input: UplinkInput,
  ): UplinkOutputSuccessfulRadioUnitIdentification | OutputFailure {
    const minLength = 24

    const warnings: OutputWarning[] = []

    if (input.bytes.length < minLength) {
      return createErrorMessage([
        `Radio unit identification message must contain at least ${minLength} bytes. Contains ${input.bytes.length} bytes.`,
      ])
    }

    if (input.bytes.length > minLength) {
      addWarningMessages(warnings, [
        `Radio unit identification message contains more than ${minLength} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
      ])
    }

    const messageType = input.bytes[0]! as 0x07
    const configurationId = input.bytes[1]!

    const productId = input.bytes[2]! as 0x0E
    if (productId !== 0x0E) {
      return createErrorMessage([
        `Radio unit identification message contains an invalid product ID: ${productId}, expected 0x0e (14).`,
      ])
    }
    const productSubId = input.bytes[3]! as 0x00
    if (productSubId !== 0x00) {
      return createErrorMessage([
        `Radio unit identification message contains an invalid product sub ID: ${productSubId}, expected 0x00 (0).`,
      ])
    }
    // get the semver version. major,minor are from same byte each 4 bit but patch is full next byte
    const radioUnitModemFirmwareVersion = `${input.bytes[4]! >> 4}.${
      input.bytes[4]! & 0x0F
    }.${input.bytes[5]}` as `${number}.${number}.${number}`
    const radioUnitModemHardwareVersion = `${input.bytes[6]! >> 4}.${
      input.bytes[6]! & 0x0F
    }.${input.bytes[7]}` as `${number}.${number}.${number}`
    const radioUnitFirmwareVersion = `${input.bytes[8]! >> 4}.${
      input.bytes[8]! & 0x0F
    }.${input.bytes[9]}` as `${number}.${number}.${number}`
    const radioUnitHardwareVersion = `${input.bytes[10]! >> 4}.${
      input.bytes[10]! & 0x0F
    }.${input.bytes[11]}` as `${number}.${number}.${number}`

    const checkSemVerVersionsErrors = checkSemVerVersions([
      radioUnitModemFirmwareVersion,
      radioUnitModemHardwareVersion,
      radioUnitFirmwareVersion,
      radioUnitHardwareVersion,
    ])
    if (checkSemVerVersionsErrors) {
      addWarningMessages(warnings, checkSemVerVersionsErrors)
    }

    const serialNumberASCII = input.bytes
      // ! here not take the byte 24 as it is 0x00
      .slice(12, 23)
      .map(byte => String.fromCharCode(byte))
      .join('')

    const res: UplinkOutputSuccessfulRadioUnitIdentification = {
      data: {
        messageType,
        configurationId,
        radioUnitIdentification: {
          productId,
          productSubId,
          radioUnitModemFirmwareVersion,
          radioUnitModemHardwareVersion,
          radioUnitFirmwareVersion,
          radioUnitHardwareVersion,
          serialNumber: serialNumberASCII,
        },
      },
    }

    if (warnings.length > 0) {
      res.warnings = warnings
    }

    return res
  }

  function decodeKeepAliveMessage(
    input: UplinkInput,
  ): UplinkOutputSuccessfulKeepAlive | OutputFailure {
    const minLength = 12

    const warnings: OutputWarning[] = []

    if (input.bytes.length !== minLength) {
      return createErrorMessage([
        `Keep alive message must contain at least ${minLength} bytes. Contains ${input.bytes.length} bytes.`,
      ])
    }

    if (input.bytes.length > minLength) {
      addWarningMessages(warnings, [
        `Keep alive message contains more than ${minLength} bytes. Data might been decoded incorrectly. Contains ${input.bytes.length} bytes.`,
      ])
    }

    const messageType = input.bytes[0]! as 0x08
    const configurationId = input.bytes[1]!

    // u32b integer index 2-5
    const numberOfMeasurements = (input.bytes[2]! << 24)
      | (input.bytes[3]! << 16) | (input.bytes[4]! << 8) | input.bytes[5]!
    const numberOfTransmissions = (input.bytes[6]! << 24)
      | (input.bytes[7]! << 16) | (input.bytes[8]! << 8) | input.bytes[9]!
    const batteryResetSinceLastKeepAlive: boolean
      = !!(input.bytes[10]! & 0b1000_0000)
    const estimatedBatteryPercent = input.bytes[10]! & 0b0111_1111
    const batteryCalculationError: boolean = estimatedBatteryPercent === 0x7F
    const radioUnitTemperatureLevel_C = input.bytes[11]!

    const res: UplinkOutputSuccessfulKeepAlive = {
      data: {
        messageType,

        configurationId,
        deviceStatistic: {
          numberOfMeasurements,
          numberOfTransmissions,
          batteryResetSinceLastKeepAlive,
          estimatedBatteryPercent,
          batteryCalculationError,
          radioUnitTemperatureLevel_C,
        },
      },
    }

    if (warnings.length > 0) {
      res.warnings = warnings
    }

    return res
  }

  function getTechnicalAlarmCauseOfFailure(byte: number):
    | {
      sense: 0 | 1
      causeOfFailure: 0 | 1 | 2 | 3 | 4 | 5
    }
    | OutputFailure {
    const causeOfFailure = {
      // sense is bit 7
      sense: ((byte & 0b1000_0000) >> 7) as 0 | 1,
      // causeOfFailure is bit 6 to 4
      causeOfFailure: (byte & 0b0000_0111) as 0 | 1 | 2 | 3 | 4 | 5,
    }
    // validate causeOfFailure
    if (![0, 1, 2, 3, 4, 5].includes(causeOfFailure.causeOfFailure)) {
      return createErrorMessage([
        `Invalid causeOfFailure in technical alarm: ${causeOfFailure.causeOfFailure}`,
      ])
    }

    return causeOfFailure
  }

  function getProcessAlarmType(byte: number):
    | {
      sense: 0 | 1
      channelId: 0 | 1
      alarmType: 0 | 1 | 2 | 3 | 4 | 5
    }
    | OutputFailure {
    const alarmType = {
      // sense is bit 7
      sense: ((byte & 0b1000_0000) >> 7) as 0 | 1,
      // channelId is bit 6 to 3 as 0 (0b0000) or 1 (0b0001)
      channelId: ((byte & 0b0111_1000) >> 3) as 0 | 1,
      // alarmType is bit 2 to 0
      alarmType: (byte & 0b0000_0111) as 0 | 1 | 2 | 3 | 4 | 5,
    }
    // validate alarmType
    if (alarmType.channelId !== 0 && alarmType.channelId !== 1) {
      return createErrorMessage([
        `Invalid channelId in process alarm: ${alarmType.channelId}`,
      ])
    }
    if (![0, 1, 2, 3, 4, 5].includes(alarmType.alarmType)) {
      return createErrorMessage([
        `Invalid alarmType in process alarm: ${alarmType.alarmType}`,
      ])
    }

    return alarmType
  }

  function getProcessAlarmRelatedValue(
    byte1: number,
    byte2: number,
    channelId: 0 | 1,
    alarmType: 0 | 1 | 2 | 3 | 4 | 5,
  ): number | OutputError {
    const value = (byte1 << 8) | byte2

    switch (alarmType) {
      case 2:
      case 3:
        return getRealSlopeValue(channelId, value)

      case 0:
      case 1:
      case 4:
      case 5:
        return getRealMeasurementValue(channelId, value)
    }
  }

  //
  // Downlink
  //

  const DEFAULT_DOWNLINK_FPORT = 10
  const DEFAULT_CONFIGURATION_ID = 1

  function encode(input: DownlinkInput): DownlinkOutput {
    const parsedInput = validateDownlinkInput(input)
    if ('errors' in parsedInput) {
      return parsedInput
    }

    switch (parsedInput.deviceAction) {
      case 'resetToFactory':
        return encodeResetToFactory(parsedInput)

      case 'resetBatteryIndicator':
        return encodeResetBatteryIndicator(parsedInput)

      case 'disableChannel':
        return encodeDisableChannel(parsedInput)

      case 'setMainConfiguration':
        return encodeSetMainConfiguration(parsedInput)

      case 'setProcessAlarmConfiguration':
        return encodeSetProcessAlarmConfiguration(parsedInput)

      case 'setMeasureOffsetConfiguration':
        return encodeSetMeasureOffsetConfiguration(parsedInput)

      case 'setStartUpTimeConfiguration':
        return encodeSetStartUpTimeConfiguration(parsedInput)

      default:
        return createErrorMessage([
          `Downlink type ${(parsedInput as any).type} is not supported`,
        ])
    }
  }

  const configurationIdSchema = v.optional(
    v.pipe(
      v.number('configurationId needs to be a number'),
      v.integer('configurationId needs to be a number'),
      v.minValue(1, 'configurationId needs to be at least 1'),
      v.maxValue(31, 'configurationId needs to be at most 31'),
    ),
    DEFAULT_CONFIGURATION_ID,
  )

  const resetToFactorySchema = v.object({
    deviceAction: v.literal('resetToFactory'),
  })

  const resetBatteryIndicatorSchema = v.object({
    configurationId: configurationIdSchema,
    deviceAction: v.literal('resetBatteryIndicator'),
  })

  const disableChannelSchema = v.object({
    configurationId: configurationIdSchema,
    deviceAction: v.literal('disableChannel'),
    configuration: v.object({
      channel0: v.optional(
        v.object({
          disable: v.literal(true),
        }),
      ),
      channel1: v.optional(v.object({
        disable: v.literal(true),
      })),
    }),
  })

  const setMainConfigurationSchema = v.object({
    configurationId: configurationIdSchema,
    deviceAction: v.literal('setMainConfiguration'),
    configuration: v.object({
      measuringRateWhenNoAlarm: v.pipe(
        v.number('measuringRateWhenNoAlarm needs to be a number'),
        v.integer('measuringRateWhenNoAlarm needs to be an integer'),
        v.minValue(
          60,
          'measuringRateWhenNoAlarm needs to be at least 60',
        ),
        v.maxValue(
          86_400,
          'measuringRateWhenNoAlarm needs to be at most 86,400',
        ),
      ),
      publicationFactorWhenNoAlarm: v.pipe(
        v.number('publicationFactorWhenNoAlarm needs to be a number'),
        v.integer(
          'publicationFactorWhenNoAlarm needs to be an integer',
        ),
        v.minValue(
          1,
          'publicationFactorWhenNoAlarm needs to be at least 1',
        ),
        v.maxValue(
          2_880,
          'publicationFactorWhenNoAlarm needs to be at most 2,880',
        ),
      ),
      measuringRateWhenAlarm: v.pipe(
        v.number('measuringRateWhenAlarm needs to be a number'),
        v.integer('measuringRateWhenAlarm needs to be an integer'),
        v.minValue(
          60,
          'measuringRateWhenAlarm needs to be at least 60',
        ),
        v.maxValue(
          86_400,
          'measuringRateWhenAlarm needs to be at most 86,400',
        ),
      ),
      publicationFactorWhenAlarm: v.pipe(
        v.number('publicationFactorWhenAlarm needs to be a number'),
        v.integer('publicationFactorWhenAlarm needs to be an integer'),
        v.minValue(
          1,
          'publicationFactorWhenAlarm needs to be at least 1',
        ),
        v.maxValue(
          2_880,
          'publicationFactorWhenAlarm needs to be at most 2,880',
        ),
      ),
    }),
  })

  const channelConfigSchema = v.object({
    deadBand: v.pipe(
      v.number('deadBand needs to be a number'),
      v.minValue(0, 'deadBand needs to be at least 0'),
      v.maxValue(20, 'deadBand needs to be at most 20'),
    ),
    alarms: v.optional(v.object({
      lowThreshold: v.optional(v.pipe(
        v.number('lowThreshold needs to be a number'),
        v.minValue(0, 'lowThreshold needs to be at least 0'),
        v.maxValue(100, 'lowThreshold needs to be at most 100'),
      )),
      highThreshold: v.optional(v.pipe(
        v.number('highThreshold needs to be a number'),
        v.minValue(0, 'highThreshold needs to be at least 0'),
        v.maxValue(100, 'highThreshold needs to be at most 100'),
      )),
      lowThresholdWithDelay: v.optional(v.object({
        value: v.pipe(
          v.number(
            'value of lowThresholdWithDelay needs to be a number',
          ),
          v.minValue(
            0,
            'value of lowThresholdWithDelay needs to be at least 0',
          ),
          v.maxValue(
            100,
            'value of lowThresholdWithDelay needs to be at most 100',
          ),
        ),
        delay: v.pipe(
          v.number(
            'delay of lowThresholdWithDelay needs to be a number',
          ),
          v.integer(
            'delay of lowThresholdWithDelay needs to be an integer',
          ),
          v.minValue(
            0,
            'delay of lowThresholdWithDelay needs to be at least 0',
          ),
          v.maxValue(
            65_535,
            'delay of lowThresholdWithDelay needs to be at most 65,535',
          ),
        ),
      })),
      highThresholdWithDelay: v.optional(v.object({
        value: v.pipe(
          v.number(
            'value of highThresholdWithDelay needs to be a number',
          ),
          v.minValue(
            0,
            'value of highThresholdWithDelay needs to be at least 0',
          ),
          v.maxValue(
            100,
            'value of highThresholdWithDelay needs to be at most 100',
          ),
        ),
        delay: v.pipe(
          v.number(
            'delay of highThresholdWithDelay needs to be a number',
          ),
          v.integer(
            'delay of highThresholdWithDelay needs to be an integer',
          ),
          v.minValue(
            0,
            'delay of highThresholdWithDelay needs to be at least 0',
          ),
          v.maxValue(
            65_535,
            'delay of highThresholdWithDelay needs to be at most 65,535',
          ),
        ),
      })),
      fallingSlope: v.optional(v.pipe(
        v.number('fallingSlope needs to be a number'),
        v.minValue(0, 'fallingSlope needs to be at least 0'),
        v.maxValue(50, 'fallingSlope needs to be at most 50'),
      )),
      risingSlope: v.optional(v.pipe(
        v.number('risingSlope needs to be a number'),
        v.minValue(0, 'risingSlope needs to be at least 0'),
        v.maxValue(50, 'risingSlope needs to be at most 50'),
      )),
    })),
  })

  const setProcessAlarmConfigurationSchema = v.object({
    configurationId: configurationIdSchema,
    deviceAction: v.literal('setProcessAlarmConfiguration'),
    configuration: v.object({
      channel0: v.optional(channelConfigSchema),
      channel1: v.optional(channelConfigSchema),
    }),
  })

  const setMeasureOffsetConfigurationSchema = v.object({
    configurationId: configurationIdSchema,
    deviceAction: v.literal('setMeasureOffsetConfiguration'),
    configuration: v.object({
      channel0: v.optional(
        v.object({
          measureOffset: v.pipe(
            v.number(
              'measureOffset of channel0 needs to be a number',
            ),
            v.minValue(
              -5,
              'measureOffset of channel0 needs to be at least -5',
            ),
            v.maxValue(
              5,
              'measureOffset of channel0 needs to be at most 5',
            ),
          ),
        }),
      ),
      channel1: v.optional(
        v.object({
          measureOffset: v.pipe(
            v.number(
              'measureOffset of channel1 needs to be a number',
            ),
            v.minValue(
              -5,
              'measureOffset of channel1 needs to be at least -5',
            ),
            v.maxValue(
              5,
              'measureOffset of channel1 needs to be at most 5',
            ),
          ),
        }),
      ),
    }),
  })

  const startUpTimeSchema = v.object({
    configurationId: configurationIdSchema,
    deviceAction: v.literal('setStartUpTimeConfiguration'),
    configuration: v.object({
      channel0: v.optional(
        v.object({
          startUpTime: v.pipe(
            v.number(
              'startUpTime of channel0 needs to be a number',
            ),
            v.minValue(
              0.1,
              'startUpTime of channel0 needs to be at least 0.1',
            ),
            v.maxValue(
              15,
              'startUpTime of channel0 needs to be at most 15',
            ),
          ),
        }),
      ),
      channel1: v.optional(
        v.object({
          startUpTime: v.pipe(
            v.number(
              'startUpTime of channel1 needs to be a number',
            ),
            v.minValue(
              0.1,
              'startUpTime of channel1 needs to be at least 0.1',
            ),
            v.maxValue(
              15,
              'startUpTime of channel1 needs to be at most 15',
            ),
          ),
        }),
      ),
    }),
  })

  const downlinkInputSchema = v.variant('deviceAction', [
    resetToFactorySchema,
    resetBatteryIndicatorSchema,
    disableChannelSchema,
    setMainConfigurationSchema,
    setProcessAlarmConfigurationSchema,
    setMeasureOffsetConfigurationSchema,
    startUpTimeSchema,
  ])

  type DownlinkSchemaOutput = v.InferOutput<typeof downlinkInputSchema>

  function validateDownlinkInput(
    input: unknown,
  ): DownlinkSchemaOutput | OutputFailure {
    const res = v.safeParse(downlinkInputSchema, input)
    if (res.success) {
      // has type error if schema and type would not match
      return res.output
    }

    // TODO: better message with errors in schema
    return createErrorMessage(res.issues.map((i) => {
      return i.message
    }))
  }

  function encodeResetToFactory(
    _input: v.InferOutput<typeof resetToFactorySchema>,
  ): DownlinkOutput {
    // here configuration id is alway 0x00
    return { bytes: [0x00, 0x01], fPort: DEFAULT_DOWNLINK_FPORT }
  }

  function encodeResetBatteryIndicator(
    input: v.InferOutput<typeof resetBatteryIndicatorSchema>,
  ): DownlinkOutput {
    return {
      fPort: DEFAULT_DOWNLINK_FPORT,
      bytes: [...numberToIntArray(input.configurationId, 1), 0x05],
    }
  }

  function encodeDisableChannel(
    input: v.InferOutput<typeof disableChannelSchema>,
  ): DownlinkOutput {
    const bitMask = (input.configuration.channel0 ? 0b0000_0001 : 0)
      | (input.configuration.channel1 ? 0b0000_0010 : 0)
    if (bitMask === 0) {
      return createErrorMessage([
        'At least one channel must be present when disabling channels',
      ])
    }
    return {
      fPort: DEFAULT_DOWNLINK_FPORT,
      bytes: [
        ...numberToIntArray(input.configurationId, 1),
        0x11,
        bitMask,
      ],
    }
  }

  function encodeSetMainConfiguration(
    input: v.InferOutput<typeof setMainConfigurationSchema>,
  ): DownlinkOutput {
    const {
      measuringRateWhenNoAlarm,
      publicationFactorWhenNoAlarm,
      measuringRateWhenAlarm,
      publicationFactorWhenAlarm,
    } = input.configuration

    const TRANSMISSION_PERIOD = 172_800

    // both measuring rate * publication factor need to be less than or equal to 172800
    if (
      measuringRateWhenNoAlarm * publicationFactorWhenNoAlarm
      > TRANSMISSION_PERIOD
      || measuringRateWhenAlarm * publicationFactorWhenAlarm
      > TRANSMISSION_PERIOD
    ) {
      return createErrorMessage([
        'Measuring rate when no alarm * publication factor must be less than or equal to 172800',
      ])
    }

    const bytes = [
      ...numberToIntArray(input.configurationId, 1),
      0x02,
      ...numberToIntArray(measuringRateWhenNoAlarm, 4),
      ...numberToIntArray(publicationFactorWhenNoAlarm, 2),
      ...numberToIntArray(measuringRateWhenAlarm, 4),
      ...numberToIntArray(publicationFactorWhenAlarm, 2),
    ]

    return {
      fPort: DEFAULT_DOWNLINK_FPORT,
      bytes,
    }
  }

  function encodeSetMeasureOffsetConfiguration(
    input: v.InferOutput<typeof setMeasureOffsetConfigurationSchema>,
  ): DownlinkOutput {
    const {
      channel0,
      channel1,
    } = input.configuration

    const bitMask = (channel0 !== undefined ? 0b0000_0001 : 0)
      | (channel1 !== undefined ? 0b0000_0010 : 0)

    if (bitMask === 0) {
      return createErrorMessage([
        'At least one channel offset must be present when configuring offsets',
      ])
    }

    const CONVERSION_FACTOR = 100 // Example conversion factor, adjust as needed

    function int16ToBytes(value: number): number[] {
      const int16 = value & 0xFFFF // Ensure the value is 16-bit
      return [(int16 >> 8) & 0xFF, int16 & 0xFF]
    }

    // Function to convert a number to its int16C representation
    function int16C(value: number): number {
      if (value < 0) {
        return 0xFFFF + value + 1
      }
      return value
    }

    // Convert the offsets to int16C encoded bytes
    const channel0Bytes = channel0 !== undefined
      ? int16ToBytes(
          int16C(Math.floor(channel0.measureOffset * CONVERSION_FACTOR)),
        )
      : []
    const channel1Bytes = channel1 !== undefined
      ? int16ToBytes(
          int16C(Math.floor(channel1.measureOffset * CONVERSION_FACTOR)),
        )
      : []

    return {
      fPort: DEFAULT_DOWNLINK_FPORT,
      bytes: [
        ...numberToIntArray(input.configurationId, 1),
        0x30,
        bitMask,
        ...channel0Bytes,
        ...channel1Bytes,
      ],
    }
  }

  function encodeSetStartUpTimeConfiguration(
    input: v.InferOutput<typeof startUpTimeSchema>,
  ): DownlinkOutput {
    const {
      channel0,
      channel1,
    } = input.configuration

    const bitMask = (channel0 !== undefined ? 0b0000_0001 : 0)
      | (channel1 !== undefined ? 0b0000_0010 : 0)

    if (bitMask === 0) {
      return createErrorMessage([
        'At least one channel start up time must be present when configuring start up times',
      ])
    }

    // as it is sent in multiples of 100ms, 0.1s = 1
    const CONVERSION_FACTOR = 10

    const channel0Bytes = channel0 !== undefined
      ? numberToIntArray(
          Math.floor(channel0.startUpTime * CONVERSION_FACTOR),
          2,
        )
      : []
    const channel1Bytes = channel1 !== undefined
      ? numberToIntArray(
          Math.floor(channel1.startUpTime * CONVERSION_FACTOR),
          2,
        )
      : []

    return {
      fPort: DEFAULT_DOWNLINK_FPORT,
      bytes: [
        ...numberToIntArray(input.configurationId, 1),
        0x60,
        bitMask,
        ...channel0Bytes,
        ...channel1Bytes,
      ],
    }
  }

  function encodeSetProcessAlarmConfiguration(
    input: v.InferOutput<typeof setProcessAlarmConfigurationSchema>,
  ): DownlinkOutput {
    const {
      channel0,
      channel1,
    } = input.configuration

    if (!channel0 && !channel1) {
      return createErrorMessage([
        'At least one channel must be present when configuring process alarms',
      ])
    }

    const channel0BitMap = 0b0000_0000

    const channel1BitMap = 0b0000_0001

    const channel0Bytes = channel0
      ? [
          0x20,
          0x00,
          channel0BitMap,
          ...encodeChannelConfiguration(channel0),
        ]
      : []

    const channel1Bytes = channel1
      ? [
          0x20,
          0x00,
          channel1BitMap,
          ...encodeChannelConfiguration(channel1),
        ]
      : []

    return {
      fPort: DEFAULT_DOWNLINK_FPORT,
      bytes: [
        ...numberToIntArray(input.configurationId, 1),
        ...channel0Bytes,
        ...channel1Bytes,
      ],
    }
  }

  function encodeChannelConfiguration(
    channel: v.InferOutput<typeof channelConfigSchema>,
  ): number[] {
    const DEAD_BAND_FACTOR = 100

    const deadBandBytes = numberToIntArray(
      Math.floor(channel.deadBand * DEAD_BAND_FACTOR),
      2,
    )

    const alarmBitMap = (channel.alarms?.lowThreshold ? 0b1000_0000 : 0)
      | (channel.alarms?.highThreshold ? 0b0100_0000 : 0)
      | (channel.alarms?.fallingSlope ? 0b0010_0000 : 0)
      | (channel.alarms?.risingSlope ? 0b0001_0000 : 0)
      | (channel.alarms?.lowThresholdWithDelay ? 0b0000_1000 : 0)
      | (channel.alarms?.highThresholdWithDelay ? 0b0000_0100 : 0)

    // corrects the value
    // e.g. 100.00 -> 12500
    function thresholdValueConversion(v: number): number {
      return Math.floor(v * 100) + 2500
    }

    function slopeConversion(v: number): number {
      return Math.floor(v * 100)
    }

    const lowThresholdBytes = channel.alarms?.lowThreshold
      ? numberToIntArray(
          thresholdValueConversion(channel.alarms.lowThreshold),
          2,
        )
      : []
    const highThresholdBytes = channel.alarms?.highThreshold
      ? numberToIntArray(
          thresholdValueConversion(channel.alarms.highThreshold),
          2,
        )
      : []
    const fallingSlopeBytes = channel.alarms?.fallingSlope
      ? numberToIntArray(slopeConversion(channel.alarms.fallingSlope), 2)
      : []
    const risingSlopeBytes = channel.alarms?.risingSlope
      ? numberToIntArray(slopeConversion(channel.alarms.risingSlope), 2)
      : []
    const lowThresholdWithDelayValueBytes
      = channel.alarms?.lowThresholdWithDelay
        ? numberToIntArray(
            thresholdValueConversion(
              channel.alarms.lowThresholdWithDelay.value,
            ),
            2,
          )
        : []
    const lowThresholdWithDelayDelayBytes
      = channel.alarms?.lowThresholdWithDelay
        ? numberToIntArray(
            channel.alarms.lowThresholdWithDelay.delay,
            2,
          )
        : []
    const highThresholdWithDelayValueBytes
      = channel.alarms?.highThresholdWithDelay
        ? numberToIntArray(
            thresholdValueConversion(
              channel.alarms.highThresholdWithDelay.value,
            ),
            2,
          )
        : []
    const highThresholdWithDelayDelayBytes
      = channel.alarms?.highThresholdWithDelay
        ? numberToIntArray(
            channel.alarms.highThresholdWithDelay.delay,
            2,
          )
        : []

    const bytes = [
      ...deadBandBytes,
      alarmBitMap,
      ...lowThresholdBytes,
      ...highThresholdBytes,
      ...fallingSlopeBytes,
      ...risingSlopeBytes,
      ...lowThresholdWithDelayValueBytes,
      ...lowThresholdWithDelayDelayBytes,
      ...highThresholdWithDelayValueBytes,
      ...highThresholdWithDelayDelayBytes,
    ]

    return bytes
  }

  // ***********************************************************************************
  //          Export functions Section
  // ***********************************************************************************
  return {
    decodeUplink,
    decodeHexUplink,
    encodeDownlink,
    adjustRoundingDecimals,
  }
}
