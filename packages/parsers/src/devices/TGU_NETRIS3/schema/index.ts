/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTGUTULIP2UplinkOutputSchema } from './tulip2'
import { createTGUTULIP3UplinkOutputSchema } from './tulip3'

export function createTGUUplinkOutputSchema() {
  return v.union([
    createTGUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createTGUTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createTGUUplinkOutputSchema

export {
  UplinkOutputSchema,
}
