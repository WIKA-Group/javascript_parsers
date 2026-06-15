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
  return v.date()
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
    fPort: (v.pipe(v.number(), v.minValue(1), v.maxValue(224), v.integer())),
    /**
     * The uplink message timestamp recorded by the LoRaWAN network server as a JavaScript Date object.
     */
    recvTime: v.date(),
  }, 'Uplink input should be an object with `bytes` and optional `fPort` and `recvTime` properties.')
}

export function createHexUplinkInputSchema() {
  return v.pipe(
    v.object({
      bytes: v.pipe(v.string()),
      fPort: createFPortSchema(),
      recvTime: createRecvTimeSchema(),
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
