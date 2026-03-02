/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createNetrisFTULIP2UplinkOutputSchema } from './tulip2'

export function createNetrisFUplinkOutputSchema() {
  return v.union([
    createNetrisFTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createNetrisFUplinkOutputSchema

export {
  UplinkOutputSchema,
}
