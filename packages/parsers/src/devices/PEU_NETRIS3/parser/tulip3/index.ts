import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { createTULIP3PEUDeviceProfile } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3PEUCodec() {
  return defineTULIP3Codec(createTULIP3PEUDeviceProfile())
}
