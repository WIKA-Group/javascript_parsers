import { defineParser } from '../../../parser'
import { createPGUTULIP2Codec } from './tulip2'

export const PGU_NETRIS3_NAME = 'PGU+NETRIS3'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: PGU_NETRIS3_NAME,
    codecs: [createPGUTULIP2Codec()],
  })
}

export default useParser
