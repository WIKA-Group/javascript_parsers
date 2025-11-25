import type { DownlinkCommand } from './frames'

import { pushUint16, pushUint32 } from '../push'

const MAIN_CONFIG_COMMAND = 0x02

const MAX_TOTAL_INTERVAL_SECONDS = 172_800 // 48 hours in seconds

export interface MainConfiguration {
  /**
   * Measuring rate when no alarm is active, in seconds as integer.
   * @minimum 60
   * @maximum 86400
   * @note measuringRateWhenNoAlarm * publicationFactorWhenNoAlarm mustn't exceed 172_800 seconds (48 hours)
   */
  measuringRateWhenNoAlarm: number
  /**
   * Publication factor when no alarm is active, as integer.
   * @minimum 1
   * @maximum 2880
   * @note measuringRateWhenNoAlarm * publicationFactorWhenNoAlarm mustn't exceed 172_800 seconds (48 hours)
   */
  publicationFactorWhenNoAlarm: number
  /**
   * Measuring rate when alarm is active, in seconds as integer.
   * @minimum 60
   * @maximum 86400
   * @note measuringRateWhenAlarm * publicationFactorWhenAlarm mustn't exceed 172_800 seconds (48 hours)
   */
  measuringRateWhenAlarm: number
  /**
   * Publication factor when alarm is active, as integer.
   * @minimum 1
   * @maximum 2880
   * @note measuringRateWhenAlarm * publicationFactorWhenAlarm mustn't exceed 172_800 seconds (48 hours)
   */
  publicationFactorWhenAlarm: number
}

/**
 * Builds the main configuration buckets.
 * @param config The main configuration.
 * @param payloadLimit The payload byte limit, should be the byteLimit of a downlink frame minus 1 byte for the config ID.
 * @returns The buckets for the main configuration.
 */
export function buildMainConfigurationCommands(config: MainConfiguration | undefined, payloadLimit: number): DownlinkCommand[] {
  if (!config) {
    return []
  }

  // check if the measuring rate and publication factor combinations are valid
  const noAlarmTotalInterval = config.measuringRateWhenNoAlarm * config.publicationFactorWhenNoAlarm
  const alarmTotalInterval = config.measuringRateWhenAlarm * config.publicationFactorWhenAlarm

  if (noAlarmTotalInterval > MAX_TOTAL_INTERVAL_SECONDS) {
    throw new Error('The product of measuringRateWhenNoAlarm and publicationFactorWhenNoAlarm must not exceed 172_800 seconds (48 hours).')
  }

  if (alarmTotalInterval > MAX_TOTAL_INTERVAL_SECONDS) {
    throw new Error('The product of measuringRateWhenAlarm and publicationFactorWhenAlarm must not exceed 172_800 seconds (48 hours).')
  }

  const bytes: number[] = [MAIN_CONFIG_COMMAND]

  pushUint32(bytes, config.measuringRateWhenNoAlarm)
  pushUint16(bytes, config.publicationFactorWhenNoAlarm)
  pushUint32(bytes, config.measuringRateWhenAlarm)
  pushUint16(bytes, config.publicationFactorWhenAlarm)

  if (bytes.length > payloadLimit) {
    throw new Error(`Main configuration command exceeds byte limit of ${payloadLimit} bytes.`)
  }

  return [bytes]
}
