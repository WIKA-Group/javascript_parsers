import { NETRIS2Parser } from '@w2a-iiot/parsers'

const parser = NETRIS2Parser()

const res = parser.decodeUplink({
  bytes: [2, 0, 3, 8, 211, 31, 144],
  fPort: 1,
  recvTime: '1992-12-22T17:00:00+01:00',
})

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
  <h1>
    The payload was decoded successfully
  </h1>
  <span>
    ${JSON.stringify(res, null, 2)}
  </span>
  </div>
`
