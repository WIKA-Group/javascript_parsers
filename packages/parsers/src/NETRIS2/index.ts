import useParser from './parser'
import '../polyfills'

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
