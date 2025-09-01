import { bench, describe } from 'vitest'
import { evaluateRegisterBlocks, parseRegisterBlocks } from '../../../src/codecs/tulip3/registers'
import { createIdentificationRegisterLookup } from '../../../src/codecs/tulip3/registers/identification'
import { FullIdentificationHexString } from './constants/identification'

describe('tULIP3 Evaluate Benchmarks', () => {
  bench('full hexstring evaluation', () => {
    /* const channelConfig = {
      channel1: { min: 0, max: 100, unit: '°C', channelName: 'sensor1Channel1', measurementTypes: [] },
      channel2: { min: 0, max: 100, unit: '°C', channelName: 'sensor1Channel2', measurementTypes: [] },
      channel3: { min: 0, max: 100, unit: '°C', channelName: 'sensor1Channel3', measurementTypes: [] },
      channel4: { min: 0, max: 100, unit: '°C', channelName: 'sensor1Channel4', measurementTypes: [] },
      channel5: { min: 0, max: 100, unit: '°C', channelName: 'sensor1Channel5', measurementTypes: [] },
      channel6: { min: 0, max: 100, unit: '°C', channelName: 'sensor1Channel6', measurementTypes: [] },
      channel7: { min: 0, max: 100, unit: '°C', channelName: 'sensor1Channel7', measurementTypes: [] },
      channel8: { min: 0, max: 100, unit: '°C', channelName: 'sensor1Channel8', measurementTypes: [] },
    } */

    const identificationRegisterLookup = createIdentificationRegisterLookup()

    const parsedBlocks = parseRegisterBlocks(FullIdentificationHexString)
    evaluateRegisterBlocks(identificationRegisterLookup, parsedBlocks)
  })
})
