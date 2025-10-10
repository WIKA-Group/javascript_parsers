import useParser from './parser'
import '../../polyfills'

const {
  decodeUplink,
  decodeHexUplink,
  adjustRoundingDecimals,
  adjustMeasuringRange,
} = useParser()

export {
  adjustMeasuringRange,
  adjustRoundingDecimals,
  decodeHexUplink,
  decodeUplink,
}
