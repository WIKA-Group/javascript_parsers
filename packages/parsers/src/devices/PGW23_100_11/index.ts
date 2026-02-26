import useParser from './parser'
import '../../polyfills'

const {
  decodeUplink,
  adjustRoundingDecimals,
  decodeHexUplink,
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
