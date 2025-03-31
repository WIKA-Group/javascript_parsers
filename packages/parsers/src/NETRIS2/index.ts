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
} = useParser()

export {
  adjustRoundingDecimals,
  decodeUplink,
  encodeDownlink,
}
