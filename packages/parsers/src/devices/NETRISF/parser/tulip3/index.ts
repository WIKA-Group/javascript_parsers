import { defineTULIP3Codec } from '../../../../codecs/tulip3/codec'
import { createdTULIP3NETRISFDeviceProfile } from './profile'

// eslint-disable-next-line ts/explicit-function-return-type
export function createTULIP3NETRISFCodec() {
  return defineTULIP3Codec(createdTULIP3NETRISFDeviceProfile())
}
