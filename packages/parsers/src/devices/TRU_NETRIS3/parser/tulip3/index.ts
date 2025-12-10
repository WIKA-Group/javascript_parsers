import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { createTULIP3TRUDeviceProfile } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3TRUCodec() {
  return defineTULIP3Codec(createTULIP3TRUDeviceProfile())
}
