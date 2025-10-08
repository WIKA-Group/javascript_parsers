/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTGUTULIP2UplinkOutputSchema } from './tulip2'

export function createTGUUplinkOutputSchema() {
  return v.union([
    createTGUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createTGUUplinkOutputSchema

export {
  UplinkOutputSchema,
}
