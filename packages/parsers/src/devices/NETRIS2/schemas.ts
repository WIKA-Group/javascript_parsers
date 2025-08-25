// -------------------
// Downlink Output Schema
// -------------------
// DownlinkOutputSchema: { fPort: number, bytes: Uint8Array }

// (Definition moved below imports)
import * as v from 'valibot'
import {
  ALARM_EVENT_NAMES_DICTIONARY,
  CONFIGURATION_STATUS_NAMES_DICTIONARY,
  PROCESS_ALARM_TYPE_NAMES_DICTIONARY,
  TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY,
} from './constants'

// OutputWarningSchema and OutputErrorSchema
export const OutputWarningSchema = v.string()
export const OutputErrorSchema = v.string()

// ChannelMeasurement
export const ChannelMeasurementSchema = v.object({
  channelId: v.number(),
  value: v.number(),
  channelName: v.string(),
})

// UplinkOutputSuccessfulMeasurements
export const UplinkOutputSuccessfulMeasurementsSchema = v.object({
  warnings: v.optional(v.array(OutputWarningSchema)),
  data: v.object({
    messageType: v.picklist([1, 2]),
    configurationId: v.number(),
    measurements: v.object({
      channels: v.union([
        v.tuple([ChannelMeasurementSchema]),
        v.tuple([ChannelMeasurementSchema, ChannelMeasurementSchema]),
      ]),
    }),
  }),
})

// UplinkOutputSuccessfulProcessAlarms
export const UplinkOutputSuccessfulProcessAlarmsSchema = v.object({
  warnings: v.optional(v.array(OutputWarningSchema)),
  data: v.object({
    messageType: v.literal(3),
    configurationId: v.number(),
    processAlarms: v.array(v.object({
      channelId: v.number(),
      channelName: v.string(),
      event: v.picklist([0, 1]),
      eventName: v.picklist([...ALARM_EVENT_NAMES_DICTIONARY]),
      alarmType: v.number(),
      alarmTypeName: v.picklist([...PROCESS_ALARM_TYPE_NAMES_DICTIONARY]),
      value: v.number(),
    })),
  }),
})

// ChannelTechnicalAlarmData
export const ChannelTechnicalAlarmDataSchema = v.object({
  channelId: v.number(),
  channelName: v.string(),
  event: v.picklist([0, 1]),
  eventName: v.picklist([...ALARM_EVENT_NAMES_DICTIONARY]),
  causeOfFailure: v.picklist([0, 1, 2, 3, 4, 5]),
  causeOfFailureName: v.picklist([...TECHNICAL_ALARM_CAUSE_OF_FAILURE_NAMES_DICTIONARY]),
})

// UplinkOutputSuccessfulTechnicalAlarms
export const UplinkOutputSuccessfulTechnicalAlarmsSchema = v.object({
  warnings: v.optional(v.array(OutputWarningSchema)),
  data: v.object({
    messageType: v.literal(4),
    configurationId: v.number(),
    technicalAlarms: v.array(ChannelTechnicalAlarmDataSchema),
  }),
})

// UplinkOutputSuccessfulConfigurationStatus
export const UplinkOutputSuccessfulConfigurationStatusSchema = v.object({
  warnings: v.optional(v.array(OutputWarningSchema)),
  data: v.object({
    messageType: v.literal(6),
    configurationId: v.number(),
    configurationStatus: v.object({
      statusId: v.picklist(
        Object.keys(CONFIGURATION_STATUS_NAMES_DICTIONARY).map(Number) as (keyof typeof CONFIGURATION_STATUS_NAMES_DICTIONARY)[],
      ),
      status: v.picklist(Object.values(CONFIGURATION_STATUS_NAMES_DICTIONARY)),
    }),
  }),
})

// UplinkOutputSuccessfulRadioUnitIdentification
export const UplinkOutputSuccessfulRadioUnitIdentificationSchema = v.object({
  warnings: v.optional(v.array(OutputWarningSchema)),
  data: v.object({
    messageType: v.literal(7),
    configurationId: v.number(),
    radioUnitIdentification: v.object({
      productId: v.literal(0x0E),
      productSubId: v.literal(0x00),
      radioUnitModemFirmwareVersion: v.string(),
      radioUnitModemHardwareVersion: v.string(),
      radioUnitFirmwareVersion: v.string(),
      radioUnitHardwareVersion: v.string(),
      serialNumber: v.string(),
    }),
  }),
})

// UplinkOutputSuccessfulKeepAlive
export const UplinkOutputSuccessfulKeepAliveSchema = v.object({
  warnings: v.optional(v.array(OutputWarningSchema)),
  data: v.object({
    messageType: v.literal(8),
    configurationId: v.number(),
    deviceStatistic: v.object({
      numberOfMeasurements: v.number(),
      numberOfTransmissions: v.number(),
      batteryResetSinceLastKeepAlive: v.boolean(),
      estimatedBatteryPercent: v.number(),
      batteryCalculationError: v.boolean(),
      radioUnitTemperatureLevel_C: v.number(),
    }),
  }),
})

// OutputFailure
export const OutputFailureSchema = v.object({
  errors: v.array(OutputErrorSchema),
})

// UplinkOutputSuccessful union
export const UplinkOutputSuccessfulSchema = v.union([
  UplinkOutputSuccessfulMeasurementsSchema,
  UplinkOutputSuccessfulProcessAlarmsSchema,
  UplinkOutputSuccessfulTechnicalAlarmsSchema,
  UplinkOutputSuccessfulConfigurationStatusSchema,
  UplinkOutputSuccessfulRadioUnitIdentificationSchema,
  UplinkOutputSuccessfulKeepAliveSchema,
])

// UplinkOutputSchema union
export const UplinkOutputSchema = v.union([
  UplinkOutputSuccessfulSchema,
  OutputFailureSchema,
])

// Infer types
export type OutputWarning = v.InferOutput<typeof OutputWarningSchema>
export type OutputError = v.InferOutput<typeof OutputErrorSchema>
export type ChannelMeasurement = v.InferOutput<typeof ChannelMeasurementSchema>
export type UplinkOutputSuccessfulMeasurements = v.InferOutput<typeof UplinkOutputSuccessfulMeasurementsSchema>
export type UplinkOutputSuccessfulProcessAlarms = v.InferOutput<typeof UplinkOutputSuccessfulProcessAlarmsSchema>
export type ChannelTechnicalAlarmData = v.InferOutput<typeof ChannelTechnicalAlarmDataSchema>
export type UplinkOutputSuccessfulTechnicalAlarms = v.InferOutput<typeof UplinkOutputSuccessfulTechnicalAlarmsSchema>
export type UplinkOutputSuccessfulConfigurationStatus = v.InferOutput<typeof UplinkOutputSuccessfulConfigurationStatusSchema>
export type UplinkOutputSuccessfulRadioUnitIdentification = v.InferOutput<typeof UplinkOutputSuccessfulRadioUnitIdentificationSchema>
export type UplinkOutputSuccessfulKeepAlive = v.InferOutput<typeof UplinkOutputSuccessfulKeepAliveSchema>
export type OutputFailure = v.InferOutput<typeof OutputFailureSchema>
export type UplinkOutputSuccessful = v.InferOutput<typeof UplinkOutputSuccessfulSchema>
export type UplinkOutput = v.InferOutput<typeof UplinkOutputSchema>

// -------------------
// Downlink Schemas
// -------------------

// Common configurationId schema
const configurationIdSchema = v.optional(
  v.pipe(
    v.number('configurationId needs to be a number'),
    v.minValue(1, 'configurationId needs to be at least 1'),
    v.maxValue(31, 'configurationId needs to be at most 31'),
    v.integer('configurationId needs to be an integer'),
    v.description('The configuration ID. Integer between 1 and 31. Default: 1.'),
  ),
  1,
)

// DownlinkInputResetToFactory
export const DownlinkInputResetToFactorySchema = v.object({
  deviceAction: v.pipe(
    v.literal('resetToFactory'),
    v.description('Resets the device to factory settings.'),
  ),
})

// DownlinkInputBatteryReset
export const DownlinkInputBatteryResetSchema = v.object({
  configurationId: configurationIdSchema,
  deviceAction: v.pipe(
    v.literal('resetBatteryIndicator'),
    v.description('Resets the battery indicator.'),
  ),
})

// DownlinkInputDisableChannel
export const DownlinkInputDisableChannelSchema = v.object({
  configurationId: configurationIdSchema,
  deviceAction: v.pipe(
    v.literal('disableChannel'),
    v.description('Disables one or more channels.'),
  ),
  configuration: v.pipe(
    v.object({
      channel0: v.optional(
        v.object({
          disable: v.pipe(
            v.literal(true),
            v.description('Set to true to disable channel 0.'),
          ),
        }),
      ),
      channel1: v.optional(
        v.object({
          disable: v.pipe(
            v.literal(true),
            v.description('Set to true to disable channel 1.'),
          ),
        }),
      ),
    }),
    v.description('A channel can be reenabled with an "empty" process alarm message (no alarms).'),
  ),
})

// DownlinkInputMainConfiguration
export const DownlinkInputMainConfigurationSchema = v.object({
  configurationId: configurationIdSchema,
  deviceAction: v.pipe(
    v.literal('setMainConfiguration'),
    v.description('Sets the main configuration.'),
  ),
  configuration: v.object({
    measuringRateWhenNoAlarm: v.pipe(
      v.number(),
      v.minValue(60),
      v.maxValue(86400),
      v.integer(),
      v.description('Measuring rate when no alarm (seconds). Integer between 60 and 86400.'),
    ),
    publicationFactorWhenNoAlarm: v.pipe(
      v.number(),
      v.minValue(1),
      v.maxValue(2880),
      v.integer(),
      v.description('Publication factor when no alarm. Integer between 1 and 2880.'),
    ),
    measuringRateWhenAlarm: v.pipe(
      v.number(),
      v.minValue(60),
      v.maxValue(86400),
      v.integer(),
      v.description('Measuring rate when alarm (seconds). Integer between 60 and 86400.'),
    ),
    publicationFactorWhenAlarm: v.pipe(
      v.number(),
      v.minValue(1),
      v.maxValue(2880),
      v.integer(),
      v.description('Publication factor when alarm. Integer between 1 and 2880.'),
    ),
  }),
})

// ChannelConfig for DownlinkInputSetProcessAlarmConfiguration
export const ChannelConfigSchema = v.object({
  deadBand: v.pipe(
    v.number(),
    v.minValue(0),
    v.maxValue(20),
    v.description('Dead Band setting (max 20% of measuring range). Only uses the first 2 decimal places.'),
  ),
  alarms: v.optional(
    v.object({
      lowThreshold: v.optional(
        v.pipe(
          v.number(),
          v.maxValue(100),
          v.description('Low threshold value (max 100).'),
        ),
      ),
      highThreshold: v.optional(
        v.pipe(
          v.number(),
          v.maxValue(100),
          v.description('High threshold value (max 100).'),
        ),
      ),
      lowThresholdWithDelay: v.optional(
        v.object({
          value: v.pipe(
            v.number(),
            v.maxValue(100),
            v.description('Low threshold with delay value (max 100).'),
          ),
          delay: v.pipe(
            v.number(),
            v.description('Delay for low threshold with delay.'),
          ),
        }),
      ),
      highThresholdWithDelay: v.optional(
        v.object({
          value: v.pipe(
            v.number(),
            v.maxValue(100),
            v.description('High threshold with delay value (max 100).'),
          ),
          delay: v.pipe(
            v.number(),
            v.description('Delay for high threshold with delay.'),
          ),
        }),
      ),
      risingSlope: v.optional(
        v.pipe(
          v.number(),
          v.description('Rising slope value.'),
        ),
      ),
      fallingSlope: v.optional(
        v.pipe(
          v.number(),
          v.description('Falling slope value.'),
        ),
      ),
    }),
  ),
})

// DownlinkInputSetProcessAlarmConfiguration
export const DownlinkInputSetProcessAlarmConfigurationSchema = v.object({
  configurationId: configurationIdSchema,
  deviceAction: v.pipe(
    v.literal('setProcessAlarmConfiguration'),
    v.description('Sets the process alarm configuration.'),
  ),
  configuration: v.object({
    channel0: v.optional(ChannelConfigSchema),
    channel1: v.optional(ChannelConfigSchema),
  }),
})

// DownlinkInputSetMeasureOffsetConfiguration
export const DownlinkInputSetMeasureOffsetConfigurationSchema = v.object({
  configurationId: configurationIdSchema,
  deviceAction: v.pipe(
    v.literal('setMeasureOffsetConfiguration'),
    v.description('Sets the measure offset configuration.'),
  ),
  configuration: v.object({
    channel0: v.optional(
      v.object({
        measureOffset: v.pipe(
          v.number(),
          v.minValue(-5),
          v.maxValue(5),
          v.description('Offset value for measurement correction. Only uses the first 2 decimal places. Unit: percent (%).'),
        ),
      }),
    ),
    channel1: v.optional(
      v.object({
        measureOffset: v.pipe(
          v.number(),
          v.minValue(-5),
          v.maxValue(5),
          v.description('Offset value for measurement correction. Only uses the first 2 decimal places. Unit: percent (%).'),
        ),
      }),
    ),
  }),
})

// DownlinkInputSetStartUpTimeConfiguration
export const DownlinkInputSetStartUpTimeConfigurationSchema = v.object({
  configurationId: configurationIdSchema,
  deviceAction: v.pipe(
    v.literal('setStartUpTimeConfiguration'),
    v.description('Sets the start-up time configuration.'),
  ),
  configuration: v.object({
    channel0: v.optional(
      v.object({
        startUpTime: v.pipe(
          v.number(),
          v.minValue(0.1),
          v.maxValue(15),
          v.description('Start-up time for channel 0 in seconds (s). Only uses the first decimal place.'),
        ),
      }),
    ),
    channel1: v.optional(
      v.object({
        startUpTime: v.pipe(
          v.number(),
          v.minValue(0.1),
          v.maxValue(15),
          v.description('Start-up time for channel 1 in seconds (s). Only uses the first decimal place.'),
        ),
      }),
    ),
  }),
})

// DownlinkInput union
export const DownlinkInputSchema = v.union([
  DownlinkInputResetToFactorySchema,
  DownlinkInputBatteryResetSchema,
  DownlinkInputDisableChannelSchema,
  DownlinkInputMainConfigurationSchema,
  DownlinkInputSetProcessAlarmConfigurationSchema,
  DownlinkInputSetMeasureOffsetConfigurationSchema,
  DownlinkInputSetStartUpTimeConfigurationSchema,
])

// Infer types
export type DownlinkInputResetToFactory = v.InferInput<typeof DownlinkInputResetToFactorySchema>
export type DownlinkInputBatteryReset = v.InferInput<typeof DownlinkInputBatteryResetSchema>
export type DownlinkInputDisableChannel = v.InferInput<typeof DownlinkInputDisableChannelSchema>
export type DownlinkInputMainConfiguration = v.InferInput<typeof DownlinkInputMainConfigurationSchema>
export type ChannelConfig = v.InferInput<typeof ChannelConfigSchema>
export type DownlinkInputSetProcessAlarmConfiguration = v.InferInput<typeof DownlinkInputSetProcessAlarmConfigurationSchema>
export type DownlinkInputSetMeasureOffsetConfiguration = v.InferInput<typeof DownlinkInputSetMeasureOffsetConfigurationSchema>
export type DownlinkInputSetStartUpTimeConfiguration = v.InferInput<typeof DownlinkInputSetStartUpTimeConfigurationSchema>
export type DownlinkInput = v.InferInput<typeof DownlinkInputSchema>

// -------------------
// Downlink Output Schema
// -------------------

const uint8Schema = v.pipe(
  v.number(),
  v.minValue(0),
  v.maxValue(255),
  v.integer(),
  v.description('8-bit unsigned integer'),
)

export const DownlinkOutputSuccessfulSchema = v.object({
  fPort: v.number(),
  bytes: v.array(uint8Schema),
})

export const DownlinkOutputSchema = v.union([
  DownlinkOutputSuccessfulSchema,
  OutputFailureSchema,
])

export type DownlinkOutputSuccessful = v.InferOutput<typeof DownlinkOutputSuccessfulSchema>
export type DownlinkOutput = v.InferOutput<typeof DownlinkOutputSchema>

export default {
  UplinkOutputSchema,
  DownlinkInputSchema,
}
