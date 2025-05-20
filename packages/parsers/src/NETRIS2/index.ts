import useParser from './parser'
import '../polyfills'

export type {
  DownlinkInput,
  UplinkOutput,
} from './parser'

const {
  decodeUplink,
  encodeDownlink,
  adjustRoundingDecimals,
  decodeHexUplink,
} = useParser()

export {
  adjustRoundingDecimals,
  decodeHexUplink,
  decodeUplink,
  encodeDownlink,
}
