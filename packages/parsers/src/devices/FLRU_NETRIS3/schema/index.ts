/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createFLRUTULIP2UplinkOutputSchema } from './tulip2'

export function createFLRUUplinkOutputSchema() {
  return v.union([
    createFLRUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createFLRUUplinkOutputSchema

export {
  UplinkOutputSchema,
}
