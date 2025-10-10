import { defineParser } from '../../../parser'
import { createTULIP2A2GCodec } from './tulip2'

export const A2G_NAME = 'A2G'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: A2G_NAME,
    codecs: [createTULIP2A2GCodec()],
  })
}

export default useParser
