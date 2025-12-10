/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTRUTULIP2UplinkOutputSchema } from './tulip2'
import { createTRUTULIP3UplinkOutputSchema } from './tulip3'

export function createTRUUplinkOutputSchema() {
  return v.union([
    createTRUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createTRUTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createTRUUplinkOutputSchema

export {
  UplinkOutputSchema,
}
