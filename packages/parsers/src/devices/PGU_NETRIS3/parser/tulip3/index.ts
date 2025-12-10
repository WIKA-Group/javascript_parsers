import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { createTULIP3PGUDeviceProfile } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3PGUCodec() {
  return defineTULIP3Codec(createTULIP3PGUDeviceProfile())
}
