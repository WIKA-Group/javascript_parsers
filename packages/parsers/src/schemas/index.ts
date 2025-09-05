/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'

export function createSemVerSchema() {
  return v.pipe(
    v.string(),
    // https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
    v.regex(
      // eslint-disable-next-line regexp/use-ignore-case
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
      'The version is not a valid semver.',
    ),
  )
}

function createFPortSchema() {
  return v.pipe(v.number(), v.minValue(1), v.maxValue(255), v.integer())
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
  }, 'Uplink input should be an object with `bytes` and optional `fPort` and `recvTime` properties.')
}

export function createHexUplinkInputSchema() {
  return v.pipe(
    v.union([
      v.object({
        bytes: v.pipe(v.string()),
        fPort: v.optional(createFPortSchema()),
        recvTime: createRecvTimeSchema(),
      }),
      v.string(),
    ]),
    v.transform((input) => {
      if (typeof input === 'string') {
        return { bytes: input }
      }
      return input
    }),
  )
}

export function createUplinkOutputFailureSchema() {
  return v.object({
    errors: v.array(v.string()),
  })
}

export type UplinkInput = v.InferOutput<ReturnType<typeof createUplinkInputSchema>>
export type HexUplinkInput = v.InferOutput<ReturnType<typeof createHexUplinkInputSchema>>
