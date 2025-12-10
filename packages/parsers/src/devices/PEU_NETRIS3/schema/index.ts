/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createPEUTULIP2UplinkOutputSchema } from './tulip2'
import { createPEUTULIP3UplinkOutputSchema } from './tulip3'

export function createPEUUplinkOutputSchema() {
  return v.union([
    createPEUTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createPEUTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createPEUUplinkOutputSchema

export {
  UplinkOutputSchema,
}
