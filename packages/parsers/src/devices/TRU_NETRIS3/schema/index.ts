/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTRUTULIP2UplinkOutputSchema } from './tulip2'

export function createTRUUplinkOutputSchema() {
  return v.union([
    createTRUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createTRUUplinkOutputSchema

export {
  UplinkOutputSchema,
}
