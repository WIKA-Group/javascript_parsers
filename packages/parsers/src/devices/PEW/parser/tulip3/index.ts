import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { PEW_TULIP3_PROFILE } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3PEWCodec() {
  return defineTULIP3Codec(PEW_TULIP3_PROFILE)
}
