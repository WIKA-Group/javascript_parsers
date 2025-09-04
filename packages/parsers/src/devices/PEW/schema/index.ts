/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createPEWTULIP1UplinkOutputSchema } from './tulip1'

export function createPEWUplinkOutputSchema() {
  return v.union([
    createPEWTULIP1UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}
