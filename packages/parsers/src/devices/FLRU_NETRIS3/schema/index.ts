/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createFLRUTULIP2UplinkOutputSchema } from './tulip2'
import { createFLRUTULIP3UplinkOutputSchema } from './tulip3'

export function createFLRUUplinkOutputSchema() {
  return v.union([
    createFLRUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createFLRUTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createFLRUUplinkOutputSchema

export {
  UplinkOutputSchema,
}
