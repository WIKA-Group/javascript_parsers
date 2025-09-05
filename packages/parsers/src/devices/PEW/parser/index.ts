import { defineParser } from '../../../parser'
import { createTULIP1PEWCodec } from './tulip1'
import { createTULIP3PEWCodec } from './tulip3'

export const PEW_NAME = 'PEW-1000'

// TODO: test if the codecs are truly unique if multiple are called here (might be channel pollution due to same reference)

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: PEW_NAME,
    codecs: [createTULIP1PEWCodec(), createTULIP3PEWCodec()],
  })
}

export default useParser
