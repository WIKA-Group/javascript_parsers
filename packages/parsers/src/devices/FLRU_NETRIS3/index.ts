import useParser from './parser'
import '../../polyfills'

const {
  adjustMeasuringRange,
  adjustRoundingDecimals,
  decodeHexUplink,
  decodeUplink,
} = useParser()

export {
  adjustMeasuringRange,
  adjustRoundingDecimals,
  decodeHexUplink,
  decodeUplink,
}
