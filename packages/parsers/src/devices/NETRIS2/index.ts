import useParser from './parser'
import '../../polyfills'

const {
  decodeUplink,
  encodeDownlink,
  adjustRoundingDecimals,
  decodeHexUplink,
  encodeMultipleDownlinks,
  adjustMeasuringRange,
} = useParser()

export {
  adjustMeasuringRange,
  adjustRoundingDecimals,
  decodeHexUplink,
  decodeUplink,
  encodeDownlink,
  encodeMultipleDownlinks,
}
