import { defineParser } from '../../../parser'
import { createNETRIS2TULIP2Codec } from './tulip2'

export const NETRIS2_NAME = 'NETRIS2'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: NETRIS2_NAME,
    codecs: [createNETRIS2TULIP2Codec()],
  })
}

export default useParser
