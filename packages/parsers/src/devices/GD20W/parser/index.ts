import { defineParser } from '../../../parser'
import { createTULIP2GD20WCodec } from './tulip2'

export const GD20W_NAME = 'GD-20-W'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: GD20W_NAME,
    codecs: [createTULIP2GD20WCodec()],
  })
}

export default useParser
