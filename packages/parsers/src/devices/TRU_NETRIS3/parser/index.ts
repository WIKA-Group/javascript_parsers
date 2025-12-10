import { defineParser } from '../../../parser'
import { createTRUTULIP2Codec } from './tulip2'
import { createTULIP3TRUCodec } from './tulip3'

export const TRU_NETRIS3_NAME = 'TRU+NETRIS3'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: TRU_NETRIS3_NAME,
    codecs: [createTRUTULIP2Codec(), createTULIP3TRUCodec()],
  })
}

export default useParser
