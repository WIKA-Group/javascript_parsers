import { defineParser } from '../../../parser'
import { createTULIP2TRWCodec } from './tulip2'
import { createTULIP3TRWCodec } from './tulip3'

export const TRW_NAME = 'TRW'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: TRW_NAME,
    codecs: [createTULIP2TRWCodec(), createTULIP3TRWCodec()],
  })
}

export default useParser
