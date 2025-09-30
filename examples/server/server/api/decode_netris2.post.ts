import {
  NETRIS2Parser,
} from '@w2a-iiot/parsers'

export default defineEventHandler(async (event) => {
  const parser = NETRIS2Parser()
  const body = await readBody(event)
  return parser.decodeUplink(body)
})
