import type { ReadMultipleInputData } from '../../../schemas/tulip3/downlink/read'
import type { WriteMultipleInputData } from '../../../schemas/tulip3/downlink/write'
import type { Merge } from '../../../types'
import type { TULIP3DeviceConfig, TULIP3DeviceProfile } from '../profile'
import type { RegisterCommand } from './utils'
import { getChannelConfigAddress, getChannelIdAddress, getSensorConfigAddress, getSensorIdAddress } from '../../addresses'
import {
  booleanToIntTuple1,
  float32ToIntTuple4,
  int8ToIntTuple1,
  processAlarmEnabledToIntTuple1,
  protocolDataTypeToIntTuple1,
  sampleChannelsToIntTuple1,
  uint8ToIntTuple1,
  uint16ToIntTuple2,
  uint32ToIntTuple4,
  unitToIntTuple1,
} from './parsing'

interface CompleteChannelConfig {
  start: number
  end: number
  registerConfig: {
    tulip3IdentificationRegisters: {
      measurand: true
      unit: true
      minMeasureRange: true
      maxMeasureRange: true
      minPhysicalLimit: true
      maxPhysicalLimit: true
      accuracy: true
      offset: true
      gain: true
      calibrationDate: true
    }
    tulip3ConfigurationRegisters: {
      protocolDataType: true
      processAlarmEnabled: true
      processAlarmDeadBand: true
      lowThresholdAlarmValue: true
      highThresholdAlarmValue: true
      fallingSlopeAlarmValue: true
      risingSlopeAlarmValue: true
      lowThresholdWithDelayAlarmValue: true
      lowThresholdWithDelayAlarmDelay: true
      highThresholdWithDelayAlarmValue: true
      highThresholdWithDelayAlarmDelay: true
    }
    channelSpecificIdentificationRegisters: Record<string, never>
    channelSpecificConfigurationRegisters: Record<string, never>
  }
}

interface CompleteSensorConfig {
  registerConfig: {
    tulip3IdentificationRegisters: {
      sensorType: true
      existingChannels: true
      firmwareVersion: true
      hardwareVersion: true
      productionDate: true
      serialNumberPart1: true
      serialNumberPart2: true
    }
    tulip3ConfigurationRegisters: {
      samplingChannels: true
      bootTime: true
      communicationTimeout: true
      communicationRetryCount: true
    }
    sensorSpecificIdentificationRegisters: Record<string, never>
    sensorSpecificConfigurationRegisters: Record<string, never>
  }
  channel1: CompleteChannelConfig
  channel2: CompleteChannelConfig
  channel3: CompleteChannelConfig
  channel4: CompleteChannelConfig
  channel5: CompleteChannelConfig
  channel6: CompleteChannelConfig
  channel7: CompleteChannelConfig
  channel8: CompleteChannelConfig
}

type CompleteTULIP3DeviceConfig = TULIP3DeviceConfig & {
  registerConfig: {
    tulip3IdentificationRegisters: {
      productId: true
      productSubId: true
      channelPlan: true
      connectedSensors: true
      firmwareVersion: true
      hardwareVersion: true
      productionDate: true
      serialNumberPart1: true
      serialNumberPart2: true
    }
    tulip3ConfigurationRegisters: {
      measuringPeriodAlarmOff: true
      measuringPeriodAlarmOn: true
      transmissionRateAlarmOff: true
      transmissionRateAlarmOn: true
      overVoltageThreshold: true
      underVoltageThreshold: true
      overTemperatureCmChip: true
      underTemperatureCmChip: true
      downlinkAnswerTimeout: true
      fetchAdditionalDownlinkTimeInterval: true
      enableBleAdvertising: true
    }
  }
  sensor1: CompleteSensorConfig
  sensor2: CompleteSensorConfig
  sensor3: CompleteSensorConfig
  sensor4: CompleteSensorConfig
}

function registerWanted(value: unknown): value is Exclude<unknown, null | undefined | false>
function registerWanted(value: unknown, allowFalse: false): value is Exclude<unknown, null | undefined | false>
function registerWanted(value: unknown, allowFalse: true): value is Exclude<unknown, null | undefined>
function registerWanted(value: unknown, allowFalse: boolean = false): boolean {
  // Reject null/undefined
  if (value === null || value === undefined) {
    return false
  }

  // When allowFalse is false (read mode), also reject false values
  if (!allowFalse && value === false) {
    return false
  }

  // Accept any other truthy value
  return true
}

export function encodeReadWriteFactory<const TTULIP3DeviceConfig extends TULIP3DeviceConfig>(_profile: TULIP3DeviceProfile<TTULIP3DeviceConfig>) {
  return <TMode extends 'read' | 'write'>(
    mode: TMode,
    input: TMode extends 'write' ? WriteMultipleInputData<TTULIP3DeviceConfig> : ReadMultipleInputData<TTULIP3DeviceConfig>,
  ): { identification: RegisterCommand[], configuration: RegisterCommand[] } => {
    // Cast to complete config for type hints and autocomplete
    const i = input as WriteMultipleInputData<CompleteTULIP3DeviceConfig> | ReadMultipleInputData<CompleteTULIP3DeviceConfig>

    const isReadMode = mode === 'read'

    const cCommands: RegisterCommand[] = []
    const iCommands: RegisterCommand[] = []

    // ========================================================================
    // COMMUNICATION MODULE REGISTERS
    // ========================================================================
    if (i.communicationModule) {
      const cm = i.communicationModule

      // CM Identification Registers (read-only, only exists in read mode)
      if (isReadMode && 'identification' in cm) {
        const cmId = cm.identification
        if (cmId) {
          if (registerWanted(cmId.productId)) {
            iCommands.push({
              address: 0x000,
              size: 1,
              value: undefined,
            })
          }

          if (registerWanted(cmId.productSubId)) {
            iCommands.push({
              address: 0x001,
              size: 1,
              value: undefined,
            })
          }

          if (registerWanted(cmId.channelPlan)) {
            iCommands.push({
              address: 0x002,
              size: 1,
              value: undefined,
            })
          }

          if (registerWanted(cmId.connectedSensors)) {
            iCommands.push({
              address: 0x003,
              size: 1,
              value: undefined,
            })
          }

          if (registerWanted(cmId.firmwareVersion)) {
            iCommands.push({
              address: 0x004,
              size: 3,
              value: undefined,
            })
          }

          if (registerWanted(cmId.hardwareVersion)) {
            iCommands.push({
              address: 0x007,
              size: 3,
              value: undefined,
            })
          }

          if (registerWanted(cmId.productionDate)) {
            iCommands.push({
              address: 0x00A,
              size: 3,
              value: undefined,
            })
          }

          if (registerWanted(cmId.serialNumberPart1)) {
            iCommands.push({
              address: 0x00D,
              size: 5,
              value: undefined,
            })
          }

          if (registerWanted(cmId.serialNumberPart2)) {
            iCommands.push({
              address: 0x012,
              size: 6,
              value: undefined,
            })
          }
        }
      }

      // CM Configuration Registers
      if (cm.configuration) {
        // needs to be casted to have correct type hints
        const cmConfig = cm.configuration as Merge<typeof cm.configuration>

        if (registerWanted(cmConfig.measuringPeriodAlarmOff)) {
          cCommands.push({
            address: 0x000,
            size: 4,
            value: isReadMode ? undefined : uint32ToIntTuple4(cmConfig.measuringPeriodAlarmOff as any),
          })
        }

        if (registerWanted(cmConfig.measuringPeriodAlarmOn)) {
          cCommands.push({
            address: 0x004,
            size: 4,
            value: isReadMode ? undefined : uint32ToIntTuple4(cmConfig.measuringPeriodAlarmOn as any),
          })
        }

        if (registerWanted(cmConfig.transmissionRateAlarmOff)) {
          cCommands.push({
            address: 0x008,
            size: 2,
            value: isReadMode ? undefined : uint16ToIntTuple2(cmConfig.transmissionRateAlarmOff as any),
          })
        }

        if (registerWanted(cmConfig.transmissionRateAlarmOn)) {
          cCommands.push({
            address: 0x00A,
            size: 2,
            value: isReadMode ? undefined : uint16ToIntTuple2(cmConfig.transmissionRateAlarmOn as any),
          })
        }

        // overVoltageThreshold is READ-ONLY
        if (isReadMode && registerWanted(cmConfig.overVoltageThreshold)) {
          cCommands.push({
            address: 0x00C,
            size: 2,
            value: undefined,
          })
        }

        // underVoltageThreshold is READ-ONLY
        if (isReadMode && registerWanted(cmConfig.underVoltageThreshold)) {
          cCommands.push({
            address: 0x00E,
            size: 2,
            value: undefined,
          })
        }

        if (registerWanted(cmConfig.overTemperatureCmChip)) {
          cCommands.push({
            address: 0x010,
            size: 1,
            value: isReadMode ? undefined : int8ToIntTuple1(cmConfig.overTemperatureCmChip as any),
          })
        }

        if (registerWanted(cmConfig.underTemperatureCmChip)) {
          cCommands.push({
            address: 0x011,
            size: 1,
            value: isReadMode ? undefined : int8ToIntTuple1(cmConfig.underTemperatureCmChip as any),
          })
        }

        if (registerWanted(cmConfig.downlinkAnswerTimeout)) {
          cCommands.push({
            address: 0x012,
            size: 1,
            value: isReadMode ? undefined : uint8ToIntTuple1(cmConfig.downlinkAnswerTimeout as any),
          })
        }

        if (registerWanted(cmConfig.fetchAdditionalDownlinkTimeInterval)) {
          cCommands.push({
            address: 0x013,
            size: 1,
            value: isReadMode ? undefined : uint8ToIntTuple1(cmConfig.fetchAdditionalDownlinkTimeInterval as any),
          })
        }

        if (registerWanted(cmConfig.enableBleAdvertising, true)) {
          cCommands.push({
            address: 0x014,
            size: 1,
            value: isReadMode ? undefined : booleanToIntTuple1(cmConfig.enableBleAdvertising as any),
          })
        }
      }
    }

    // ========================================================================
    // SENSOR REGISTERS
    // ========================================================================
    const sensors = ['sensor1', 'sensor2', 'sensor3', 'sensor4'] as const

    sensors.forEach((sensorKey, index) => {
      const sensorNum = index + 1
      const sensor = i[sensorKey]

      if (sensor) {
        // Compute base addresses once for this sensor
        const sensorIdBase = getSensorIdAddress(sensorNum, 0)
        const sensorConfigBase = getSensorConfigAddress(sensorNum, 0)

        // Sensor Identification Registers (read-only, only exists in read mode)
        if (isReadMode && 'identification' in sensor) {
          const sensorId = sensor.identification
          if (sensorId) {
            if (registerWanted(sensorId.sensorType)) {
              iCommands.push({
                address: sensorIdBase + 0x00,
                size: 2,
                value: undefined,
              })
            }

            if (registerWanted(sensorId.existingChannels)) {
              iCommands.push({
                address: sensorIdBase + 0x02,
                size: 1,
                value: undefined,
              })
            }

            if (registerWanted(sensorId.firmwareVersion)) {
              iCommands.push({
                address: sensorIdBase + 0x03,
                size: 3,
                value: undefined,
                // Note: firmwareVersion requires semver encoder (not implemented yet)
              })
            }

            if (registerWanted(sensorId.hardwareVersion)) {
              iCommands.push({
                address: sensorIdBase + 0x06,
                size: 3,
                value: undefined,
                // Note: hardwareVersion requires semver encoder (not implemented yet)
              })
            }

            if (registerWanted(sensorId.productionDate)) {
              iCommands.push({
                address: sensorIdBase + 0x09,
                size: 3,
                value: undefined,
                // Note: productionDate requires date encoder (not implemented yet)
              })
            }

            if (registerWanted(sensorId.serialNumberPart1)) {
              iCommands.push({
                address: sensorIdBase + 0x0C,
                size: 5,
                value: undefined,
                // Note: serialNumberPart1 requires ASCII encoder (not implemented yet)
              })
            }

            if (registerWanted(sensorId.serialNumberPart2)) {
              iCommands.push({
                address: sensorIdBase + 0x11,
                size: 6,
                value: undefined,
                // Note: serialNumberPart2 requires ASCII encoder (not implemented yet)
              })
            }
          }
        }

        // Sensor Configuration Registers
        if (sensor.configuration) {
          const sensorConfig = sensor.configuration

          if (registerWanted(sensorConfig.samplingChannels, true)) {
            cCommands.push({
              address: sensorConfigBase + 0x00,
              size: 1,
              value: isReadMode ? undefined : sampleChannelsToIntTuple1(sensorConfig.samplingChannels as any),
            })
          }

          if (registerWanted(sensorConfig.bootTime)) {
            cCommands.push({
              address: sensorConfigBase + 0x01,
              size: 2,
              value: isReadMode ? undefined : uint16ToIntTuple2(sensorConfig.bootTime as any),
            })
          }

          if (registerWanted(sensorConfig.communicationTimeout)) {
            cCommands.push({
              address: sensorConfigBase + 0x03,
              size: 2,
              value: isReadMode ? undefined : uint16ToIntTuple2(sensorConfig.communicationTimeout as any),
            })
          }

          if (registerWanted(sensorConfig.communicationRetryCount)) {
            cCommands.push({
              address: sensorConfigBase + 0x05,
              size: 1,
              value: isReadMode ? undefined : uint8ToIntTuple1(sensorConfig.communicationRetryCount as any),
            })
          }
        }

        // ====================================================================
        // CHANNEL REGISTERS
        // ====================================================================
        const channels = ['channel1', 'channel2', 'channel3', 'channel4', 'channel5', 'channel6', 'channel7', 'channel8'] as const

        channels.forEach((channelKey, channelIndex) => {
          const channelNum = channelIndex + 1
          const channel = sensor[channelKey]

          if (channel) {
            // Compute base addresses once for this channel
            const channelIdBase = getChannelIdAddress(sensorNum, channelNum, 0)
            const channelConfigBase = getChannelConfigAddress(sensorNum, channelNum, 0)
            // Channel Identification Registers
            if (channel.identification) {
              // needs to be casted to have correct type hints
              const channelId = channel.identification as Merge<typeof channel.identification>

              // measurand is READ-ONLY
              if (isReadMode && registerWanted(channelId.measurand)) {
                iCommands.push({
                  address: channelIdBase + 0x00,
                  size: 1,
                  value: undefined,
                })
              }
              // unit is READ/WRITE
              if (registerWanted(channelId.unit)) {
                iCommands.push({
                  address: channelIdBase + 0x01,
                  size: 1,
                  value: isReadMode ? undefined : unitToIntTuple1(channelId.unit as any),
                })
              }

              // minMeasureRange is READ-ONLY
              if (isReadMode && registerWanted(channelId.minMeasureRange)) {
                iCommands.push({
                  address: channelIdBase + 0x02,
                  size: 4,
                  value: undefined,
                })
              }

              // maxMeasureRange is READ-ONLY
              if (isReadMode && registerWanted(channelId.maxMeasureRange)) {
                iCommands.push({
                  address: channelIdBase + 0x06,
                  size: 4,
                  value: undefined,
                })
              }

              // minPhysicalLimit is READ-ONLY
              if (isReadMode && registerWanted(channelId.minPhysicalLimit)) {
                iCommands.push({
                  address: channelIdBase + 0x0A,
                  size: 4,
                  value: undefined,
                })
              }

              // maxPhysicalLimit is READ-ONLY
              if (isReadMode && registerWanted(channelId.maxPhysicalLimit)) {
                iCommands.push({
                  address: channelIdBase + 0x0E,
                  size: 4,
                  value: undefined,
                })
              }

              // accuracy is READ-ONLY
              if (isReadMode && registerWanted(channelId.accuracy)) {
                iCommands.push({
                  address: channelIdBase + 0x12,
                  size: 2,
                  value: undefined,
                })
              }

              // offset is READ/WRITE
              if (registerWanted(channelId.offset)) {
                iCommands.push({
                  address: channelIdBase + 0x14,
                  size: 4,
                  value: isReadMode ? undefined : float32ToIntTuple4(channelId.offset as any),
                })
              }

              // gain is READ/WRITE
              if (registerWanted(channelId.gain)) {
                iCommands.push({
                  address: channelIdBase + 0x18,
                  size: 4,
                  value: isReadMode ? undefined : float32ToIntTuple4(channelId.gain as any),
                })
              }

              // calibrationDate is READ-ONLY
              if (isReadMode && registerWanted(channelId.calibrationDate)) {
                iCommands.push({
                  address: channelIdBase + 0x1C,
                  size: 3,
                  value: undefined,
                })
              }
            }

            // Channel Configuration Registers
            if (channel.configuration) {
              const channelConfig = channel.configuration

              if (registerWanted(channelConfig.protocolDataType)) {
                cCommands.push({
                  address: channelConfigBase + 0x00,
                  size: 1,
                  value: isReadMode ? undefined : protocolDataTypeToIntTuple1(channelConfig.protocolDataType as any),
                })
              }

              if (registerWanted(channelConfig.processAlarmEnabled, true)) {
                cCommands.push({
                  address: channelConfigBase + 0x01,
                  size: 1,
                  value: isReadMode ? undefined : processAlarmEnabledToIntTuple1(channelConfig.processAlarmEnabled as any),
                })
              }

              if (registerWanted(channelConfig.processAlarmDeadBand)) {
                cCommands.push({
                  address: channelConfigBase + 0x02,
                  size: 4,
                  value: isReadMode ? undefined : float32ToIntTuple4(channelConfig.processAlarmDeadBand as any),
                })
              }

              if (registerWanted(channelConfig.lowThresholdAlarmValue)) {
                cCommands.push({
                  address: channelConfigBase + 0x06,
                  size: 4,
                  value: isReadMode ? undefined : float32ToIntTuple4(channelConfig.lowThresholdAlarmValue as any),
                })
              }

              if (registerWanted(channelConfig.highThresholdAlarmValue)) {
                cCommands.push({
                  address: channelConfigBase + 0x0A,
                  size: 4,
                  value: isReadMode ? undefined : float32ToIntTuple4(channelConfig.highThresholdAlarmValue as any),
                })
              }

              if (registerWanted(channelConfig.fallingSlopeAlarmValue)) {
                cCommands.push({
                  address: channelConfigBase + 0x0E,
                  size: 4,
                  value: isReadMode ? undefined : float32ToIntTuple4(channelConfig.fallingSlopeAlarmValue as any),
                })
              }

              if (registerWanted(channelConfig.risingSlopeAlarmValue)) {
                cCommands.push({
                  address: channelConfigBase + 0x12,
                  size: 4,
                  value: isReadMode ? undefined : float32ToIntTuple4(channelConfig.risingSlopeAlarmValue as any),
                })
              }

              if (registerWanted(channelConfig.lowThresholdWithDelayAlarmValue)) {
                cCommands.push({
                  address: channelConfigBase + 0x16,
                  size: 4,
                  value: isReadMode ? undefined : float32ToIntTuple4(channelConfig.lowThresholdWithDelayAlarmValue as any),
                })
              }

              if (registerWanted(channelConfig.lowThresholdWithDelayAlarmDelay)) {
                cCommands.push({
                  address: channelConfigBase + 0x1A,
                  size: 2,
                  value: isReadMode ? undefined : uint16ToIntTuple2(channelConfig.lowThresholdWithDelayAlarmDelay as any),
                })
              }

              if (registerWanted(channelConfig.highThresholdWithDelayAlarmValue)) {
                cCommands.push({
                  address: channelConfigBase + 0x1C,
                  size: 4,
                  value: isReadMode ? undefined : float32ToIntTuple4(channelConfig.highThresholdWithDelayAlarmValue as any),
                })
              }

              if (registerWanted(channelConfig.highThresholdWithDelayAlarmDelay)) {
                cCommands.push({
                  address: channelConfigBase + 0x20,
                  size: 2,
                  value: isReadMode ? undefined : uint16ToIntTuple2(channelConfig.highThresholdWithDelayAlarmDelay as any),
                })
              }
            }
          }
        })
      }
    })

    return {
      identification: iCommands,
      configuration: cCommands,
    }
  }
}
