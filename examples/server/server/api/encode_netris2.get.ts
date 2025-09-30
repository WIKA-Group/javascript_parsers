import {
  NETRIS2Parser,
} from '@w2a-iiot/parsers'

export default defineEventHandler(async () => {
  const parser = NETRIS2Parser()
  const result = parser.encodeDownlink({
    deviceAction: 'downlinkConfiguration',
    spreadingFactor: 'SF10',
    configuration: {
      mainConfiguration: {
        measuringRateWhenAlarm: 300,
        measuringRateWhenNoAlarm: 3600,
        publicationFactorWhenAlarm: 1,
        publicationFactorWhenNoAlarm: 1,
      },
    },
  })

  if (result.success) {
    return {
      frames: result.data.frames,
    }
  }
  else {
    throw createError({
      statusCode: 400,
      statusMessage: 'Failed to encode downlink',
      data: result.errors,
    })
  }
})
