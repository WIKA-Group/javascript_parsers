import * as Ajv from 'ajv'
import * as fs from 'fs-extra'
import { describe, it, expect } from 'vitest'
import * as driver from "./index.js"

const ajv = new Ajv({ allErrors: true })
import * as betterAjvErrors from 'better-ajv-errors'

// Get the list of examples
const examples = fs.readJsonSync(`${__dirname}/examples.json`)

// Load json schema file
const jsonSchema = fs.readJsonSync(`${__dirname}/uplink.schema.json`)

/* ..............
Test suites
.............. */

describe('decode uplink', () => {
  driver.setMeasurementRanges(0, 100, -40, 60)

  it.each(examples)('$description', (example) => {
    if (example.type === 'uplink') {
      // Given
      const input = {
        bytes: example.input.bytes,
        fPort: example.input.fPort,
      }

      if (example.input.recvTime !== undefined) {
        input.recvTime = example.input.recvTime
      }

      // When
      const result = driver.decodeUplink(input)
      const validate = ajv.compile(jsonSchema)
      try {
        expect(validate(result)).toBe(true)
      }
      catch (e) {
        throw new Error(betterAjvErrors(jsonSchema, result, validate.errors))
      }

      // Then
      const expected = example.output
      expect(result).toStrictEqual(expected)
    }
    else if (example.type === 'uplink_base64') {
      // Given
      const input = {
        bytes: example.input.bytes,
        fPort: example.input.fPort,
      }

      if (example.input.recvTime !== undefined) {
        input.recvTime = example.input.recvTime
      }

      // When
      const result = driver.decodeBase64String(input.fPort, input.bytes)
      const validate = ajv.compile(jsonSchema)
      try {
        expect(validate(result)).toBe(true)
      }
      catch (e) {
        throw new Error(betterAjvErrors(jsonSchema, result, validate.errors))
      }

      // Then
      const expected = example.output
      expect(result).toStrictEqual(expected)
    }
    else if (example.type === 'uplink_hex') {
      // Given
      const input = {
        bytes: example.input.bytes,
        fPort: example.input.fPort,
      }

      if (example.input.recvTime !== undefined) {
        input.recvTime = example.input.recvTime
      }

      // When
      const result = driver.decodeHexString(input.fPort, input.bytes)
      const validate = ajv.compile(jsonSchema)
      try {
        expect(validate(result)).toBe(true)
      }
      catch (e) {
        throw new Error(betterAjvErrors(jsonSchema, result, validate.errors))
      }

      // Then
      const expected = example.output
      expect(result).toStrictEqual(expected)
    }
  })
})
