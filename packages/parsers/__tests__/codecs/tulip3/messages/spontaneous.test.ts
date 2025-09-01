import { describe, expect, it } from 'vitest'
import { spontaneousStatusLookup } from '../../../../src/codecs/tulip3/lookups'
import { allowedTypeSubTypeCombinations, decodeSpontaneousFetchAdditionalDownlinkMessageMessage, decodeSpontaneousGenericDownlinkAnswerMessage } from '../../../../src/codecs/tulip3/messages/spontaneous'

describe('tulip3 spontaneous downlink answer message decoding (0x17/0x01)', () => {
  describe('valid messages', () => {
    it('should decode the example from the docs (new battery inserted, success)', () => {
      // 0x17 01 03 03 00
      const data = [0x17, 0x01, 0x03, 0x03, 0x00]
      const result = decodeSpontaneousGenericDownlinkAnswerMessage(data)
      expect(result).toEqual({
        data: {
          messageType: 0x17,
          messageSubType: 0x01,
          spontaneousDownlinkAnswer: {
            answeredDownlink: { type: 0x03, subType: 0x03 },
            status: spontaneousStatusLookup[0],
          },
        },
      })
    })

    it('should decode a message with device error and deviceErrorCode', () => {
      // 0x17 01 10 01 04 0xAB
      const data = [0x17, 0x01, 0x01, 0x01, 0x04, 0xAB]
      const result = decodeSpontaneousGenericDownlinkAnswerMessage(data)
      expect(result).toEqual({
        data: {
          messageType: 0x17,
          messageSubType: 0x01,
          spontaneousDownlinkAnswer: {
            answeredDownlink: { type: 0x01, subType: 0x01 },
            status: spontaneousStatusLookup[4],
            deviceErrorCode: 0xAB,
          },
        },
      })
    })

    it('should decode all allowed type/subtype combinations with success status', () => {
      for (const typeString of Object.keys(allowedTypeSubTypeCombinations)) {
        const type = Number.parseInt(typeString, 10) as keyof typeof allowedTypeSubTypeCombinations
        for (const subType of allowedTypeSubTypeCombinations[type]) {
          const data = [0x17, 0x01, type, subType, 0x00]
          const result = decodeSpontaneousGenericDownlinkAnswerMessage(data)
          expect(result.data.spontaneousDownlinkAnswer.answeredDownlink).toEqual({ type, subType })
          expect(result.data.spontaneousDownlinkAnswer.status).toBe(spontaneousStatusLookup[0])
        }
      }
    })

    it('should decode all status codes (except device error) without deviceErrorCode', () => {
      for (let status = 0; status <= 6; status++) {
        if (status === 4)
          continue // device error handled separately
        const data = [0x17, 0x01, 0x2, 0x01, status]
        const result = decodeSpontaneousGenericDownlinkAnswerMessage(data)
        // @ts-expect-error - status is a number
        expect(result.data.spontaneousDownlinkAnswer.status).toBe(spontaneousStatusLookup[status])
        // @ts-expect-error - deviceErrorCode should not be present
        expect(result.data.spontaneousDownlinkAnswer.deviceErrorCode).toBeUndefined()
      }
    })

    it('should decode device error with all possible deviceErrorCode values', () => {
      for (let code = 0; code <= 255; code += 1) { // test a few values
        const data = [0x17, 0x01, 0x01, 0x01, 0x04, code]
        const result = decodeSpontaneousGenericDownlinkAnswerMessage(data)
        expect(result.data.spontaneousDownlinkAnswer.status).toBe(spontaneousStatusLookup[4])
        // @ts-expect-error - deviceErrorCode should be present
        expect(result.data.spontaneousDownlinkAnswer.deviceErrorCode).toBe(code)
      }
    })
  })

  describe('error handling', () => {
    it('should throw error for invalid message type', () => {
      const data = [0x16, 0x01, 0x10, 0x01, 0x00]
      expect(() => decodeSpontaneousGenericDownlinkAnswerMessage(data)).toThrow('Invalid message type: expected 0x17 but got 0x16')
    })

    it('should throw error for invalid sub message type', () => {
      const data = [0x17, 0x02, 0x10, 0x01, 0x00]
      expect(() => decodeSpontaneousGenericDownlinkAnswerMessage(data)).toThrow('Unsupported spontaneous downlink answer message subtype: 0x02. Allowed subtypes: 0x01')
    })

    it('should throw error for message too short (less than 5 bytes)', () => {
      const data = [0x17, 0x01, 0x10]
      expect(() => decodeSpontaneousGenericDownlinkAnswerMessage(data)).toThrow('Spontaneous downlink answer message too short. Expected at least 5 bytes but got 3')
    })

    it('should throw error for invalid type/subType combination', () => {
      const data = [0x17, 0x01, 0x00, 0x00, 0x00]
      expect(() => decodeSpontaneousGenericDownlinkAnswerMessage(data)).toThrow('Answered downlink can not have a combination of type: 0 and subType: 0')
    })

    it('should throw error for invalid status byte', () => {
      const data = [0x17, 0x01, 0x01, 0x01, 0xFF]
      expect(() => decodeSpontaneousGenericDownlinkAnswerMessage(data)).toThrow('Invalid status byte: 255')
    })

    it('should throw error for missing device error code when status is device error', () => {
      const data = [0x17, 0x01, 0x03, 0x01, 0x04]
      expect(() => decodeSpontaneousGenericDownlinkAnswerMessage(data)).toThrow('Device error code missing for Device error status (expected 6 bytes)')
    })

    it('should throw error for extra bytes when status is not device error', () => {
      const data = [0x17, 0x01, 0x02, 0x01, 0x00, 0x01]
      expect(() => decodeSpontaneousGenericDownlinkAnswerMessage(data)).toThrow('Spontaneous downlink answer message has unexpected extra bytes. Expected 5 bytes for status Success but got 6')
    })
  })

  describe('edge cases', () => {
    it('should throw error for undefined/null message type gracefully', () => {
      const data = [undefined as any, 0x01, 0x10, 0x01, 0x00]
      expect(() => decodeSpontaneousGenericDownlinkAnswerMessage(data)).toThrow('Cannot read properties of undefined (reading \'toString\')')
    })

    it('should throw error for undefined/null sub message type gracefully', () => {
      const data = [0x17, undefined as any, 0x10, 0x01, 0x00]
      expect(() => decodeSpontaneousGenericDownlinkAnswerMessage(data)).toThrow('Unsupported spontaneous downlink answer message subtype: 0x00. Allowed subtypes: 0x01')
    })
  })
})

describe('tulip3 spontaneous fetch additional downlink message decoding (0x17/0x02)', () => {
  // Import here to avoid hoisting issues with require

  it('should decode a valid fetch additional downlink message', () => {
    const data = [0x17, 0x02]
    const result = decodeSpontaneousFetchAdditionalDownlinkMessageMessage(data)
    expect(result).toEqual({
      data: {
        messageType: 0x17,
        messageSubType: 0x02,
      },
    })
  })

  it('should throw error for invalid message type', () => {
    const data = [0x16, 0x02]
    expect(() => decodeSpontaneousFetchAdditionalDownlinkMessageMessage(data)).toThrow('Invalid message type: expected 0x17 but got 0x16')
  })

  it('should throw error for invalid sub message type', () => {
    const data = [0x17, 0x03]
    expect(() => decodeSpontaneousFetchAdditionalDownlinkMessageMessage(data)).toThrow('Unsupported spontaneous fetch additional downlink message subtype: 0x03. Allowed subtypes: 0x02')
  })

  it('should throw error for message too long (more than 2 bytes)', () => {
    const data = [0x17, 0x02, 0x00]
    expect(() => decodeSpontaneousFetchAdditionalDownlinkMessageMessage(data)).toThrow(`Spontaneous fetch additional downlink message has invalid length. Expected 2 bytes but got 3`)
  })

  it('should throw error for message too short (less than 2 bytes)', () => {
    const data = [0x17]
    expect(() => decodeSpontaneousFetchAdditionalDownlinkMessageMessage(data)).toThrow(`Spontaneous fetch additional downlink message too short. Expected at least 2 bytes but got 1`)
  })
})
