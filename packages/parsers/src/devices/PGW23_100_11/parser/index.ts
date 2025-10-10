import { defineParser } from '../../../parser'
import { createTULIP2PGWCodec } from './tulip2'

export const PGW23_100_11_NAME = 'PGW23.100.11'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: PGW23_100_11_NAME,
    codecs: [createTULIP2PGWCodec()],
  })
}

export default useParser
