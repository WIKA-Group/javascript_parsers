/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createA2GTULIP2UplinkOutputSchema } from './tulip2'

export function createA2GUplinkOutputSchema() {
  return v.union([
    createA2GTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

const UplinkOutputSchema = createA2GUplinkOutputSchema

export {
  UplinkOutputSchema,
}
