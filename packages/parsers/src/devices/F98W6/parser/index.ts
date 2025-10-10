import { defineParser } from '../../../parser'
import { createF98W6TULIP2Codec } from './tulip2'

export const F98W6_NAME = 'F98W6'

// eslint-disable-next-line ts/explicit-function-return-type
export function useParser() {
  return defineParser({
    parserName: F98W6_NAME,
    codecs: [createF98W6TULIP2Codec()],
  })
}

export default useParser
