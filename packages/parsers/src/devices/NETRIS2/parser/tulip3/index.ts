import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { createdTULIP3NETRIS2DeviceProfile } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3NETRIS2Codec() {
  return defineTULIP3Codec(createdTULIP3NETRIS2DeviceProfile())
}
