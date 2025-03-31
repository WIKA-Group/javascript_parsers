import { FirstFitDecreasing } from './ffd'

export type Frame = number[]

export function concatFrames(frames: Frame[], byteLimit: number, configurationId: number, maxConfigId: number): Frame[] {
  // actualLimit is byteLimit - 1 as we need to readd the configurationId
  const actualLimit = byteLimit - 1
  // remove the configurationId from each Frame
  const framesWithoutConfigurationId = frames.map(frame => frame.slice(1))

  // now stitch frames in every single possible way together
  const stitchedFrames = FirstFitDecreasing(framesWithoutConfigurationId, actualLimit)

  // readd the configurationId to each stitched frame
  // each frame has the configurationId at the beginning but the 2. has configurationId + 1, the 3. configurationId + 2 and so on
  // configurationId is reset to 1 if it exceeds maxConfigId
  let currentConfigurationId = configurationId
  return stitchedFrames.map((stitchedFrame) => {
    const frame = [currentConfigurationId, ...stitchedFrame]
    currentConfigurationId++
    if (currentConfigurationId > maxConfigId) {
      currentConfigurationId = 1
    }
    return frame
  })
}
