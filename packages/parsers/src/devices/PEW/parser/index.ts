import { defineParser } from '../../../parser'
import { createTULIP1PEWCodec } from './tulip1'

export const PEW_NAME = 'PEW-1000'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: PEW_NAME,
    codecs: [createTULIP1PEWCodec()],
  })
}
