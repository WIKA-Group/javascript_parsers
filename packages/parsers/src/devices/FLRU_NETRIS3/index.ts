import useParser from './parser'
import '../../polyfills'

const {
  adjustMeasuringRange,
  adjustRoundingDecimals,
  decodeHexUplink,
  decodeUplink,
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
