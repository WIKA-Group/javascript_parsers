import useParser from './parser'
import '../../polyfills'

const {
  decodeUplink,
  encodeDownlink,
  adjustRoundingDecimals,
  decodeHexUplink,
  encodeMultipleDownlinks,
} = useParser()

export {
  adjustRoundingDecimals,
  decodeHexUplink,
  decodeUplink,
  encodeDownlink,
  encodeMultipleDownlinks,
}
