/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createF98W6TULIP2UplinkOutputSchema } from './tulip2'

export function createF98W6UplinkOutputSchema() {
  return v.union([
    createF98W6TULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createF98W6UplinkOutputSchema

export {
  UplinkOutputSchema,
}
