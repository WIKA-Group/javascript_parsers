/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createPEUTULIP2UplinkOutputSchema } from './tulip2'

export function createPEUUplinkOutputSchema() {
  return v.union([
    createPEUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createPEUUplinkOutputSchema

export {
  UplinkOutputSchema,
}
