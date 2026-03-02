import { defineParser } from '../../../parser'
import { createNetrisFTULIP2Codec } from './tulip2'

export const NETRISF_NAME = 'NETRIS_F'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: NETRISF_NAME,
    codecs: [createNetrisFTULIP2Codec()],
  })
}

export default useParser
