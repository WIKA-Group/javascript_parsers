import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { createdTULIP3NETRIS1DeviceProfile } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3NETRIS1Codec() {
  return defineTULIP3Codec(createdTULIP3NETRIS1DeviceProfile())
}
