import type * as v from 'valibot'
import type { CONFIGURATION_BASE_STATUS_TYPES } from '../../lookups'
import type { createConfigurationStatusUplinkOutputSchema } from './uplink'

export type TULIP2ConfigurationStatusUplinkOutput = v.InferOutput<ReturnType<typeof createConfigurationStatusUplinkOutputSchema>>

export type ConfigurationStatusTypes = typeof CONFIGURATION_BASE_STATUS_TYPES
export type ConfigurationStatusTypeKeys = (keyof typeof CONFIGURATION_BASE_STATUS_TYPES)[]
export type ConfigurationStatusTypeValues = typeof CONFIGURATION_BASE_STATUS_TYPES[keyof typeof CONFIGURATION_BASE_STATUS_TYPES][]

type DistributiveOmit<T, K extends PropertyKey> = T extends T ? Omit<T, K> : never

export type ConfigStatus = TULIP2ConfigurationStatusUplinkOutput['data']['configurationStatus']

export type MainConfigResponseData = DistributiveOmit<ConfigStatus, 'status' | 'statusDescription'>
