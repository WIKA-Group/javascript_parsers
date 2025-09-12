import { defineParser } from '../../../parser'
import { createTULIP2NETRIS1Codec } from './tulip2'
import { createTULIP3NETRIS1Codec } from './tulip3'

export const NETRIS1_NAME = 'NETRIS1'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: NETRIS1_NAME,
    codecs: [createTULIP2NETRIS1Codec(), createTULIP3NETRIS1Codec()],
  })
}

export default useParser
