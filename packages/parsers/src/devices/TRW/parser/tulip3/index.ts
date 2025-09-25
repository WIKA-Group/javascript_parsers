import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { createTULIP3TRWDeviceProfile } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3TRWCodec() {
  return defineTULIP3Codec(createTULIP3TRWDeviceProfile())
}

export {}
