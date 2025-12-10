import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { createTULIP3FLRUDeviceProfile } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3FLRUCodec() {
  return defineTULIP3Codec(createTULIP3FLRUDeviceProfile())
}
