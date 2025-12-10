import { defineParser } from '../../../parser'
import { createPEUTULIP2Codec } from './tulip2'
import { createTULIP3PEUCodec } from './tulip3'

export const PEU_NETRIS3_NAME = 'PEU+NETRIS3'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: PEU_NETRIS3_NAME,
    codecs: [createPEUTULIP2Codec(), createTULIP3PEUCodec()],
  })
}

export default useParser
