import {
  NETRIS2Parser,
} from '@w2a-iiot/parsers'

const parser = NETRIS2Parser()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return parser.decodeUplink(body)
})
