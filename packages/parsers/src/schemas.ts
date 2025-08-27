/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'

function createFPortSchema() {
  return v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(255))
}

function createRecvTimeSchema() {
  return v.optional(v.string())
}

export function createUplinkInputSchema() {
  return v.object({
    /**
     * The uplink payload byte array, where each byte is represented by an integer between 0 and 255.
     */
    bytes: v.array(v.pipe(v.number(), v.minValue(0), v.maxValue(255), v.integer())),
    /**
     * The uplink message LoRaWAN `fPort`
     */
    fPort: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(224), v.integer())),
    /**
     * ISO 8601 string representation of the time the message was received by the network server.
     */
    recvTime: v.optional(v.string()),
  })
}

export function createHexUplinkInputSchema() {
  return v.pipe(
    v.union([
      v.object({
        bytes: v.pipe(v.string()),
        fPort: v.optional(createFPortSchema()),
        recvTime: createRecvTimeSchema(),
      }),
      v.pipe(v.string()),
    ]),
    v.transform((input) => {
      if (typeof input === 'string') {
        return { bytes: input }
      }
      return input
    }),
  )
}

export type UplinkInput = v.InferOutput<ReturnType<typeof createUplinkInputSchema>>
export type HexUplinkInput = v.InferOutput<ReturnType<typeof createHexUplinkInputSchema>>
