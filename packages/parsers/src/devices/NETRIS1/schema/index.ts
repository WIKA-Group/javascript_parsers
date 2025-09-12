/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createNETRIS1TULIP2UplinkOutputSchema } from './tulip2'
import { createNETRIS1TULIP3UplinkOutputSchema } from './tulip3'

export function createNETRIS1UplinkOutputSchema() {
  return v.union([
    createUplinkOutputFailureSchema(),
    createNETRIS1TULIP3UplinkOutputSchema(),
    createNETRIS1TULIP2UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createNETRIS1UplinkOutputSchema

export {
  UplinkOutputSchema,
}
