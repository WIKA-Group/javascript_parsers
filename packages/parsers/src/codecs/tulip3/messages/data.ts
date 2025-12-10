import type { DataMessageData, DataMessageUplinkOutput } from '../../../schemas/tulip3/data'
import type { TULIP3ChannelConfig, TULIP3DeviceConfig, TULIP3SensorConfig } from '../profile'
import { validateMessageHeader } from '.'
import { DEFAULT_ROUNDING_DECIMALS, roundValue, TULIPValueToValue } from '../../../utils'
import { protocolDataTypeLengthLookup, protocolDataTypeLookup } from '../lookups'
import { intTuple2ToUInt16, intTuple4ToFloat32 } from '../registers'

interface BaseGeneralMeasurement {
  sensor: string
  sensorId: number
  channel: string
  channelId: number
  sourceDataType: typeof protocolDataTypeLookup[keyof typeof protocolDataTypeLookup]
}

interface GeneralErrorMeasurement extends BaseGeneralMeasurement {
  valueAcquisitionError: true
  value?: undefined
}

interface GeneralValueMeasurement extends BaseGeneralMeasurement {
  valueAcquisitionError: false
  /**
   * Is the actual value or the percentage if sourceDataType is Tulip scale
   */
  value: number

  // this only makes sense in the context of the int measurements which are not supported yet
  // valueRepresentationLimitReached: boolean
}

type GeneralMeasurement = GeneralValueMeasurement | GeneralErrorMeasurement

function parseDataMessage(data: number[], currentIndex = 2): [GeneralMeasurement, ...GeneralMeasurement[]] {
  // validate that there is the meta data present (so length is at least 3)

  const m: GeneralMeasurement[] = []

  // validate that there is atleast one GeneralMeasurement

  while (currentIndex < data.length) {
    // sensor id at bit 7 and 6
    const sensorId = (data[currentIndex]! & 0b1100_0000) >> 6
    // channel id at bit 5, 4 and 3
    const channelId = (data[currentIndex]! & 0b0011_1000) >> 3
    // data type at bit 2 and 1
    const dataTypeId = ((data[currentIndex]! & 0b0000_0110) >> 1) as 0 | 1 | 2 | 3
    // ov/uv flag at bit 0
    // const ovUvFlag = Boolean(data[currentIndex]! & 0b0000_0001)

    const dataType = protocolDataTypeLookup[dataTypeId]

    const dataLength = protocolDataTypeLengthLookup[dataType]

    // now we need to validate that the amount of data is left in array
    if (currentIndex + dataLength > data.length) {
      throw new RangeError(`${sensorId}, ${channelId}, Not enough data left to finish reading measurement data block for ${dataType}. Expected ${dataLength} bytes but got ${data.length - currentIndex}, with currentIndex ${currentIndex}`)
    }

    let parsed: number | 'hasError'
    switch (dataType) {
      case 'float - IEEE754':
      {
        parsed = intTuple4ToFloat32(data.slice(currentIndex + 1, currentIndex + 1 + 4) as [number, number, number, number])
        if (Number.isNaN(parsed)) {
          parsed = 'hasError'
        }
        break
      }

      case 'uint16 - TULIP scale 2500 - 12500':
      {
        // if parsed = 0xFFFF
        parsed = intTuple2ToUInt16(data.slice(currentIndex + 1, currentIndex + 1 + 2) as [number, number])
        if (parsed === 0xFFFF) {
          parsed = 'hasError'
        }
        break
      }
      case 'int 24 - Fixed-point s16.7 (Q16.7)':
      case 'int 16 - Fixed-point s10.5 (Q10.5)':
        // for parsed would need to be value 0 and ov flag set
        throw new TypeError(`Data type ${dataType} is not implemented yet`)
    }

    if (parsed === 'hasError') {
      m.push({
        sensor: `sensor${sensorId + 1}`,
        sensorId,
        channel: `channel${channelId + 1}`,
        channelId,
        sourceDataType: dataType,
        valueAcquisitionError: true,
      })
    }
    else {
      m.push({
        sensor: `sensor${sensorId + 1}`,
        sensorId,
        channel: `channel${channelId + 1}`,
        channelId,
        sourceDataType: dataType,
        valueAcquisitionError: false,
        value: parsed,
      })
    }

    currentIndex += dataLength + 1
  }

  // validate that there is atleast one GeneralMeasurement
  if (m.length === 0) {
    throw new RangeError(`Expected data message to contain at least one valid measurement, but got none`)
  }

  return m as [GeneralMeasurement, ...GeneralMeasurement[]]
}

export function decodeDataMessage<TTULIP3DeviceConfig extends TULIP3DeviceConfig>(data: number[], deviceSensorConfig: TTULIP3DeviceConfig, roundingDecimals = DEFAULT_ROUNDING_DECIMALS): DataMessageUplinkOutput<TTULIP3DeviceConfig> {
  // Validate subtype for the specific message type
  const {
    messageType,
    messageSubType,
  } = validateMessageHeader(data, {
    expectedMessageType: [0x10, 0x11],
    allowedSubTypes: [0x01],
    minLength: 3,
    messageTypeName: 'Data',
  })

  // go through the measurements and check if it tries to target a sensor/channel/dataType that is not supported
  // if the measurement is tulip, it also needs to be converted to the actual value from the range

  const blocks: DataMessageData<TTULIP3DeviceConfig> = parseDataMessage(data).map((b) => {
    // check if it was from a sensor/channel/dataType that is supported
    const config = (deviceSensorConfig[b.sensor as keyof TULIP3DeviceConfig] as TULIP3SensorConfig)?.[b.channel as keyof TULIP3SensorConfig] as TULIP3ChannelConfig | undefined

    if (!config) {
      throw new TypeError(`Measurement from sensor ${b.sensor} channel ${b.channel} is not supported by the device profile.`)
    }

    const isSupported = config.measurementTypes.includes(b.sourceDataType)

    if (!isSupported) {
      throw new TypeError(`Measurement from sensor ${b.sensor} channel ${b.channel} does not support data type ${b.sourceDataType}.`)
    }

    // now scale the tulip value if necessary
    if (b.sourceDataType === 'uint16 - TULIP scale 2500 - 12500' && b.value !== undefined) {
      b.value = TULIPValueToValue(b.value, config)
    }
    else if (b.sourceDataType !== 'uint16 - TULIP scale 2500 - 12500' && b.value !== undefined) {
      // if it is any other value, it needs to be inside the min max range
      if (b.value < config.start || b.value > config.end) {
        throw new RangeError(`Measurement for sensor ${b.sensor} channel ${b.channel} is out of range, got ${b.value}`)
      }
    }

    // round
    if (typeof b.value === 'number') {
      b.value = roundValue(b.value, roundingDecimals)
    }

    return {
      ...b,
      channelName: config.channelName,
    } as DataMessageData<TTULIP3DeviceConfig>[number]
  }) as [DataMessageData<TTULIP3DeviceConfig>[number], ...DataMessageData<TTULIP3DeviceConfig>]

  return {
    data: {
      messageType,
      messageSubType,
      measurements: blocks,
    },
  }
}
