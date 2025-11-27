import { defineParser } from '../../../parser'
import { createTULIP2PEWCodec } from './tulip2'
import { createTULIP3PEWCodec } from './tulip3'

export const PEW_NAME = 'PEW-1000'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: PEW_NAME,
    codecs: [createTULIP2PEWCodec(), createTULIP3PEWCodec()],
  })
}

export default useParser
