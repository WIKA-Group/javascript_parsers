import useParser from './parser'
import '../../polyfills'

const {
  decodeUplink,
  decodeHexUplink,
  adjustRoundingDecimals,
  adjustMeasuringRange,
  encodeDownlink,
  encodeMultipleDownlinks,
} = useParser()

export {
  adjustMeasuringRange,
  adjustRoundingDecimals,
  decodeHexUplink,
  decodeUplink,
  encodeDownlink,
  encodeMultipleDownlinks,
}
