import { bench, describe } from 'vitest'
import { evaluateRegisterBlocks, parseRegisterBlocks } from '../../../src/codecs/tulip3/registers'
import { createIdentificationRegisterLookup } from '../../../src/codecs/tulip3/registers/identification'
import { FullIdentificationHexString } from './constants/identification'
import { completeTULIP3DeviceConfig } from './presets'

const completeConfig = completeTULIP3DeviceConfig()

describe('tULIP3 Evaluate Benchmarks', () => {
  bench('full hexstring evaluation', () => {
    const identificationRegisterLookup = createIdentificationRegisterLookup(completeConfig)

    const parsedBlocks = parseRegisterBlocks(FullIdentificationHexString)
    evaluateRegisterBlocks(identificationRegisterLookup, parsedBlocks)
  })
})
