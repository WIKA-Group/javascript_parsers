/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createPEWTULIP1UplinkOutputSchema } from './tulip1'
import { createPEWTULIP3UplinkOutputSchema } from './tulip3'

export function createPEWUplinkOutputSchema() {
  return v.union([
    createPEWTULIP1UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createPEWTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createPEWUplinkOutputSchema

export {
  UplinkOutputSchema,
}
