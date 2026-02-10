/* eslint-disable ts/explicit-function-return-type */
import * as v from 'valibot'
import { createUplinkOutputFailureSchema } from '../../../schemas'
import { createParserDownlinkInputSchema } from '../../../schemas/utilts'
import { createPEWTULIP2UplinkOutputSchema } from './tulip2'
import { createPEWTULIP3DownlinkInputSchema, createPEWTULIP3UplinkOutputSchema } from './tulip3'

export function createPEWUplinkOutputSchema() {
  return v.union([
    createPEWTULIP2UplinkOutputSchema(),
    createUplinkOutputFailureSchema(),
    createPEWTULIP3UplinkOutputSchema(),
  ])
}

const UplinkOutputSchema = createPEWUplinkOutputSchema

function DownlinkInputSchema() {
  return createParserDownlinkInputSchema([
    {
      protocol: 'TULIP3',
      schema: createPEWTULIP3DownlinkInputSchema(),
    },
  ])
}

export {
  DownlinkInputSchema,
  UplinkOutputSchema,
}
