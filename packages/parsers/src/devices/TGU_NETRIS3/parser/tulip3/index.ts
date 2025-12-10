import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { createTULIP3TGUDeviceProfile } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3TGUCodec() {
  return defineTULIP3Codec(createTULIP3TGUDeviceProfile())
}
