/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createGD20WTULIP2UplinkOutputSchema } from './tulip2'

export function createGD20WUplinkOutputSchema() {
  return v.union([
    createGD20WTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
  ])
}

export {
  createGD20WTULIP2UplinkOutputSchema,
}
