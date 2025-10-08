import { defineParser } from '../../../parser'
import { createTRUTULIP2Codec } from './tulip2'

export const TRU_NETRIS3_NAME = 'TRU+NETRIS3'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: TRU_NETRIS3_NAME,
    codecs: [createTRUTULIP2Codec()],
  })
}

export default useParser
