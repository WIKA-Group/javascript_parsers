import { inspect } from 'node:util'
import { consola } from 'consola'

const res = await fetch('http://localhost:3000/api/decode_netris2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bytes: [2, 0, 3, 8, 211, 31, 144],
    fPort: 1,
    recvTime: '1992-12-22T17:00:00+01:00',
  }),
})

consola.success('The payload was decoded successfully')
consola.log(inspect(await res.json(), {
  depth: Infinity,
  colors: true,
  numericSeparator: true,
}),
)
export {}
