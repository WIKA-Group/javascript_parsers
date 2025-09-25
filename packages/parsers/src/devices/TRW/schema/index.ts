/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createTRWTULIP2UplinkOutputSchema } from './tulip2'
import { createTRWTULIP3UplinkOutputSchema } from './tulip3'

export function createTRWUplinkOutputSchema() {
  return v.union([
    createUplinkOutputFailureSchema(),
    createTRWTULIP3UplinkOutputSchema(),
    createTRWTULIP2UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createTRWUplinkOutputSchema

export {
  UplinkOutputSchema,
}
