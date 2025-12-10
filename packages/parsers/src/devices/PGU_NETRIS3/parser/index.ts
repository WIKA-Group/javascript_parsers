import { defineParser } from '../../../parser'
import { createPGUTULIP2Codec } from './tulip2'
import { createTULIP3PGUCodec } from './tulip3'

export const PGU_NETRIS3_NAME = 'PGU+NETRIS3'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: PGU_NETRIS3_NAME,
    codecs: [createPGUTULIP2Codec(), createTULIP3PGUCodec()],
  })
}

export default useParser
