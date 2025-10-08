import { defineParser } from '../../../parser'
import { createTGUTULIP2Codec } from './tulip2'

export const TGU_NETRIS3_NAME = 'TGU+NETRIS3'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: TGU_NETRIS3_NAME,
    codecs: [createTGUTULIP2Codec()],
  })
}

export default useParser
