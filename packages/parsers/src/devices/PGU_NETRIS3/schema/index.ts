/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createPGUTULIP2UplinkOutputSchema } from './tulip2'

export function createPGUUplinkOutputSchema() {
  return v.union([
    createPGUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createPGUUplinkOutputSchema

export {
  UplinkOutputSchema,
}
