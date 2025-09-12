import useParser from './parser'
import '../../polyfills'

const {
  decodeUplink,
  adjustRoundingDecimals,
  decodeHexUplink,
  adjustMeasuringRange,
} = useParser()

export {
  adjustMeasuringRange,
  adjustRoundingDecimals,
  decodeHexUplink,
  decodeUplink,
}
