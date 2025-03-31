export class ParserError extends Error {
  messages: string[]
  constructor(messages: string[]) {
    super()

    this.name = 'ParserError'
    this.messages = messages
  }
}
