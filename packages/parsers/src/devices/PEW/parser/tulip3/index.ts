import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { createdTULIP3PEWDeviceProfile } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3PEWCodec() {
  return defineTULIP3Codec(createdTULIP3PEWDeviceProfile())
}
