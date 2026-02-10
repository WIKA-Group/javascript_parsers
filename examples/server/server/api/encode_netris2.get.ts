import {
  NETRIS2Parser,
} from '@w2a-iiot/parsers'

export default defineEventHandler(async () => {
  const parser = NETRIS2Parser()
  const result = parser.encodeMultipleDownlinks({
    protocol: 'TULIP2',
    input: {
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
    },
  })

  if (!('errors' in result)) {
    return {
      frames: result.frames,
      fPort: result.fPort,
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
