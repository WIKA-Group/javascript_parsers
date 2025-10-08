import { defineParser } from '../../../parser'
import { createFLRUTULIP2Codec } from './tulip2'

export const FLRU_NETRIS3_NAME = 'FLRU+NETRIS3'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: FLRU_NETRIS3_NAME,
    codecs: [createFLRUTULIP2Codec()],
  })
}

export default useParser
