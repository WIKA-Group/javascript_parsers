/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createPGW23_100_11TULIP2UplinkOutputSchema } from './tulip2'

export function createPGW23_100_11UplinkOutputSchema() {
  return v.union([
    createPGW23_100_11TULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createPGW23_100_11UplinkOutputSchema

export {
  UplinkOutputSchema,
}
