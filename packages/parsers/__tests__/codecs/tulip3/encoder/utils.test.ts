import type { ReadRegisterCommand, WriteRegisterCommand } from '../../../../src/codecs/tulip3/encoder/utils'
import { describe, expect, it } from 'vitest'
import {
  blocksToPackets,
  blockToBytes,
  consolidateCommands,
  HEADER_SIZE,
  packCommands,
  validateCommands,
} from '../../../../src/codecs/tulip3/encoder/utils'

describe('encoder/utils', () => {
  describe('validateCommands', () => {
    it('should pass for valid read commands', () => {
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 4 },
        { address: 10, size: 2 },
      ]
      expect(() => validateCommands('read', commands)).not.toThrow()
    })

    it('should pass for valid write commands', () => {
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 4, value: [1, 2, 3, 4] },
        { address: 10, size: 2, value: [5, 6] },
      ]
      expect(() => validateCommands('write', commands)).not.toThrow()
    })

    it('should throw on duplicate address', () => {
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 4 },
        { address: 0, size: 2 },
      ]
      expect(() => validateCommands('read', commands)).toThrow('Duplicate command for address 0')
    })

    it('should throw when write command size does not match value length', () => {
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 4, value: [1, 2, 3] }, // size 4 but only 3 values
      ]
      expect(() => validateCommands('write', commands)).toThrow('Size mismatch')
    })

    it('should not validate value length for read commands', () => {
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 4 },
      ]
      expect(() => validateCommands('read', commands)).not.toThrow()
    })

    it('should pass for empty array', () => {
      expect(() => validateCommands('read', [])).not.toThrow()
      expect(() => validateCommands('write', [])).not.toThrow()
    })
  })

  describe('consolidateCommands', () => {
    it('should return empty array for empty input', () => {
      expect(consolidateCommands('read', [])).toEqual([])
    })

    it('should return single block for single command', () => {
      const commands: ReadRegisterCommand[] = [{ address: 0, size: 4 }]
      const result = consolidateCommands('read', commands)
      expect(result).toEqual([{ address: 0, size: 4 }])
    })

    it('should consolidate two contiguous read commands', () => {
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 4 },
        { address: 4, size: 4 },
      ]
      const result = consolidateCommands('read', commands)
      expect(result).toEqual([{ address: 0, size: 8 }])
    })

    it('should consolidate two contiguous write commands with values', () => {
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 4, value: [1, 2, 3, 4] },
        { address: 4, size: 4, value: [5, 6, 7, 8] },
      ]
      const result = consolidateCommands('write', commands)
      expect(result).toEqual([{ address: 0, size: 8, value: [1, 2, 3, 4, 5, 6, 7, 8] }])
    })

    it('should not consolidate non-contiguous commands', () => {
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 4 },
        { address: 10, size: 4 },
      ]
      const result = consolidateCommands('read', commands)
      expect(result).toEqual([
        { address: 0, size: 4 },
        { address: 10, size: 4 },
      ])
    })

    it('should handle commands arriving in random order', () => {
      const commands: ReadRegisterCommand[] = [
        { address: 8, size: 4 },
        { address: 0, size: 4 },
        { address: 4, size: 4 },
      ]
      const result = consolidateCommands('read', commands)
      expect(result).toEqual([{ address: 0, size: 12 }])
    })

    it('should respect maxDataSize of 31', () => {
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 20 },
        { address: 20, size: 15 }, // Would exceed 31 if combined
      ]
      const result = consolidateCommands('read', commands)
      expect(result).toEqual([
        { address: 0, size: 20 },
        { address: 20, size: 15 },
      ])
    })

    it('should consolidate up to exactly 31 bytes', () => {
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 16 },
        { address: 16, size: 15 }, // Total 31 - exactly at limit
      ]
      const result = consolidateCommands('read', commands)
      expect(result).toEqual([{ address: 0, size: 31 }])
    })

    it('should respect custom maxDataSize for write mode', () => {
      // maxDataSize only applies to WRITE mode
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 10, value: Array.from({ length: 10 }).fill(1) as number[] },
        { address: 10, size: 10, value: Array.from({ length: 10 }).fill(2) as number[] }, // Would exceed 15 if combined
      ]
      const result = consolidateCommands('write', commands, 15)
      expect(result).toEqual([
        { address: 0, size: 10, value: Array.from({ length: 10 }).fill(1) },
        { address: 10, size: 10, value: Array.from({ length: 10 }).fill(2) },
      ])
    })

    it('should ignore maxDataSize for read mode (always use MAX_SIZE)', () => {
      // For READ mode, wireSize is always 2 bytes, so we can consolidate up to 31
      // regardless of the maxDataSize parameter passed in
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 10 },
        { address: 10, size: 10 },
      ]
      const result = consolidateCommands('read', commands)
      expect(result).toEqual([{ address: 0, size: 20 }])
    })

    it('should consolidate write commands up to custom maxDataSize', () => {
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 8, value: [1, 2, 3, 4, 5, 6, 7, 8] },
        { address: 8, size: 7, value: [9, 10, 11, 12, 13, 14, 15] }, // Total 15 - exactly at custom limit
      ]
      const result = consolidateCommands('write', commands, 15)
      expect(result).toEqual([{ address: 0, size: 15, value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] }])
    })

    it('should handle multiple separate blocks', () => {
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 4, value: [1, 2, 3, 4] },
        { address: 4, size: 4, value: [5, 6, 7, 8] },
        { address: 100, size: 2, value: [9, 10] },
        { address: 102, size: 2, value: [11, 12] },
      ]
      const result = consolidateCommands('write', commands)
      expect(result).toEqual([
        { address: 0, size: 8, value: [1, 2, 3, 4, 5, 6, 7, 8] },
        { address: 100, size: 4, value: [9, 10, 11, 12] },
      ])
    })
  })

  describe('blockToBytes', () => {
    it('should convert read block to 2-byte header only (no data)', () => {
      const block = { address: 512, size: 4 }
      const result = blockToBytes('read', block)
      expect(result).toEqual([0x40, 0x04])
      expect(result.length).toBe(HEADER_SIZE)
    })

    it('should convert read block with large size still to just 2-byte header', () => {
      // Even with size 31, read mode only sends the header
      const block = { address: 0, size: 31 }
      const result = blockToBytes('read', block)
      expect(result).toEqual([0x00, 0x1F]) // address 0, size 31
      expect(result.length).toBe(HEADER_SIZE) // Still just 2 bytes!
    })

    it('should convert write block to header + value', () => {
      const block = { address: 512, size: 4, value: [1, 2, 3, 4] }
      const result = blockToBytes('write', block)
      expect(result).toEqual([0x40, 0x04, 1, 2, 3, 4])
      expect(result.length).toBe(HEADER_SIZE + 4)
    })

    it('should convert write block with large size to header + all data', () => {
      const value = Array.from({ length: 31 }).fill(0xAB) as number[]
      const block = { address: 0, size: 31, value }
      const result = blockToBytes('write', block)
      expect(result.length).toBe(HEADER_SIZE + 31) // 33 bytes total
      expect(result.slice(0, 2)).toEqual([0x00, 0x1F]) // header
      expect(result.slice(2)).toEqual(value) // data
    })

    it('should handle address 0 and size 0', () => {
      const block = { address: 0, size: 0 }
      const result = blockToBytes('read', block)
      expect(result).toEqual([0x00, 0x00])
    })
  })

  describe('blocksToPackets', () => {
    it('should convert multiple read blocks to packets', () => {
      const blocks = [
        { address: 0, size: 4 },
        { address: 100, size: 2 },
      ]
      const result = blocksToPackets('read', blocks)
      expect(result).toEqual([
        [0x00, 0x04],
        [0x0C, 0x82], // address 100 << 5 | 2 = 0xC82
      ])
    })

    it('should convert multiple write blocks to packets', () => {
      const blocks = [
        { address: 0, size: 2, value: [1, 2] },
        { address: 100, size: 2, value: [3, 4] },
      ]
      const result = blocksToPackets('write', blocks)
      expect(result).toEqual([
        [0x00, 0x02, 1, 2],
        [0x0C, 0x82, 3, 4],
      ])
    })

    it('should return empty array for empty input', () => {
      expect(blocksToPackets('read', [])).toEqual([])
    })
  })

  describe('packCommands', () => {
    it('should return empty array for empty input', () => {
      expect(packCommands('read', [], 50)).toEqual([])
    })

    it('should pack single command into single entry', () => {
      const commands: ReadRegisterCommand[] = [{ address: 0, size: 4 }]
      const result = packCommands('read', commands, 50)
      expect(result.length).toBe(1)
      expect(result[0]).toEqual([0x00, 0x04])
    })

    it('should pack contiguous commands as consolidated block', () => {
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 4, value: [1, 2, 3, 4] },
        { address: 4, size: 4, value: [5, 6, 7, 8] },
      ]
      const result = packCommands('write', commands, 50)
      expect(result.length).toBe(1)
      // Consolidated: address 0, size 8, value [1,2,3,4,5,6,7,8]
      // Header: 0x00, 0x08 (address 0 << 5 | 8)
      expect(result[0]).toEqual([0x00, 0x08, 1, 2, 3, 4, 5, 6, 7, 8])
    })

    it('should consolidate contiguous read commands into single 2-byte packet', () => {
      // KEY TEST: Two read commands at address 0 size 5 and address 5 size 5
      // consolidate to address 0 size 10 -> still just 2 bytes wireSize!
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 5 },
        { address: 5, size: 5 },
      ]
      const result = packCommands('read', commands, 10)
      // Consolidated to: address 0, size 10
      // Header: (0 << 5) | 10 = 10 = 0x000A -> [0x00, 0x0A]
      // wireSize is just 2 bytes, easily fits in 10-byte payload
      expect(result.length).toBe(1)
      expect(result[0]).toEqual([0x00, 0x0A])
      expect(result[0]!.length).toBe(2) // Just 2 bytes!
    })

    it('should consolidate many read commands into minimal packets', () => {
      // 6 contiguous read commands, each size 5 = total size 30
      // All consolidate to one block with size 30, wireSize still just 2 bytes
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 5 },
        { address: 5, size: 5 },
        { address: 10, size: 5 },
        { address: 15, size: 5 },
        { address: 20, size: 5 },
        { address: 25, size: 5 },
      ]
      const result = packCommands('read', commands, 10)
      // All consolidated to: address 0, size 30
      // wireSize = 2 bytes, fits in any payload >= 2
      expect(result.length).toBe(1)
      expect(result[0]!.length).toBe(2)
    })

    it('should split read blocks at 31-byte size limit', () => {
      // 7 contiguous read commands, each size 5 = total size 35
      // First 6 consolidate to size 30, but adding 7th would be 35 > 31
      // So we get 2 blocks: size 30 and size 5
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 5 },
        { address: 5, size: 5 },
        { address: 10, size: 5 },
        { address: 15, size: 5 },
        { address: 20, size: 5 },
        { address: 25, size: 5 },
        { address: 30, size: 5 },
      ]
      const result = packCommands('read', commands, 10)
      // Block 1: address 0, size 30 (wireSize 2)
      // Block 2: address 30, size 5 (wireSize 2)
      // Both fit in one 10-byte payload (2+2=4)
      expect(result.length).toBe(1)
      expect(result[0]!.length).toBe(4) // Two 2-byte headers
    })

    it('should use FFD to pack multiple blocks into entries', () => {
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 30, value: Array.from({ length: 30 }).fill(1) as number[] }, // wireSize: 32
        { address: 100, size: 10, value: Array.from({ length: 10 }).fill(2) as number[] }, // wireSize: 12
        { address: 200, size: 5, value: Array.from({ length: 5 }).fill(3) as number[] }, // wireSize: 7
      ]
      const result = packCommands('write', commands, 50)
      // FFD should try to pack efficiently
      // Block 0: 32 bytes, Block 100: 12 bytes, Block 200: 7 bytes
      // Entry 1: Block 0 (32) + Block 100 (12) = 44 bytes (fits in 50)
      // Entry 1 can also fit Block 200 (7) = 51 bytes (doesn't fit)
      // So: Entry 1: 32 + 12 = 44, Entry 2: 7
      // Or FFD ordering (largest first): 32, 12, 7
      // Entry 1: 32, can add 12? 44 <= 50 yes, can add 7? 51 > 50 no
      // Entry 2: 7
      expect(result.length).toBe(2)
    })

    it('should throw if payloadSize is too small for write', () => {
      const commands: WriteRegisterCommand[] = [{ address: 0, size: 4, value: [1, 2, 3, 4] }]
      expect(() => packCommands('write', commands, 2)).toThrow('Payload size 2 is too small')
    })

    it('should throw if payloadSize is too small for read', () => {
      const commands: ReadRegisterCommand[] = [{ address: 0, size: 4 }]
      expect(() => packCommands('read', commands, 1)).toThrow('Payload size 1 is too small')
    })

    it('should throw on duplicate address', () => {
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 4 },
        { address: 0, size: 2 },
      ]
      expect(() => packCommands('read', commands, 50)).toThrow('Duplicate command')
    })

    it('should throw on write size mismatch', () => {
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 4, value: [1, 2, 3] },
      ]
      expect(() => packCommands('write', commands, 50)).toThrow('Size mismatch')
    })

    it('should limit write block data size based on payload', () => {
      // payloadSize 10 means maxDataSize = 10 - 2 = 8
      // For WRITE mode, wireSize = 2 (header) + size (data)
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 5, value: [1, 2, 3, 4, 5] }, // wireSize: 7
        { address: 5, size: 5, value: [6, 7, 8, 9, 10] }, // wireSize: 7, would be 10 data bytes if consolidated (>8 max)
      ]
      const result = packCommands('write', commands, 10)
      // Cannot consolidate beyond 8 bytes data, so stays as 2 blocks
      // Block 1: addr 0, size 5, wireSize 7
      // Block 2: addr 5, size 5, wireSize 7
      // Total 14 bytes, doesn't fit in single 10-byte entry
      // FFD: first block (7) fits, second block (7) doesn't fit (7+7=14>10)
      expect(result.length).toBe(2)
    })

    it('should demonstrate read vs write wire size difference', () => {
      // Same logical commands, different wire sizes
      const readCommands: ReadRegisterCommand[] = [
        { address: 0, size: 10 },
        { address: 10, size: 10 },
      ]
      const writeCommands: WriteRegisterCommand[] = [
        { address: 0, size: 10, value: Array.from({ length: 10 }).fill(1) as number[] },
        { address: 10, size: 10, value: Array.from({ length: 10 }).fill(2) as number[] },
      ]

      // Both consolidate to size 20
      // Read: wireSize = 2 bytes (header only)
      // Write: wireSize = 2 + 20 = 22 bytes

      const readResult = packCommands('read', readCommands, 10)
      const writeResult = packCommands('write', writeCommands, 50)

      // Read: consolidated block is 2 bytes, fits in 10-byte payload
      expect(readResult.length).toBe(1)
      expect(readResult[0]!.length).toBe(2)

      // Write: consolidated block is 22 bytes (2 header + 20 data), fits in 50-byte payload
      expect(writeResult.length).toBe(1)
      expect(writeResult[0]!.length).toBe(22) // 2 header + 20 data
    })

    it('should verify FFD fills gaps with smaller blocks', () => {
      // Create a scenario where FFD should fill a gap
      // Payload: 20 bytes
      // Block A: 12 bytes (address 0, size 10 -> header 2 + data 10)
      // Block B: 8 bytes (address 100, size 6 -> header 2 + data 6)
      // Block C: 6 bytes (address 200, size 4 -> header 2 + data 4)
      // FFD sorts: A(12), B(8), C(6)
      // Entry 1: A(12), remaining 8. Can fit B(8)? Yes. Entry 1: A+B = 20
      // Entry 2: C(6)
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 10, value: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        { address: 100, size: 6, value: [2, 2, 2, 2, 2, 2] },
        { address: 200, size: 4, value: [3, 3, 3, 3] },
      ]
      const result = packCommands('write', commands, 20)

      expect(result.length).toBe(2)
      // First entry: Block A (12) + Block B (8) = 20 bytes exactly
      expect(result[0]!.length).toBe(20)
      // Second entry: Block C (6)
      expect(result[1]!.length).toBe(6)
    })

    it('should verify actual byte content after FFD packing', () => {
      // Two non-contiguous write blocks that fit in one entry
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 2, value: [0xAA, 0xBB] }, // wireSize: 4
        { address: 100, size: 2, value: [0xCC, 0xDD] }, // wireSize: 4
      ]
      const result = packCommands('write', commands, 10)

      expect(result.length).toBe(1)
      // Both blocks in one entry, total 8 bytes
      // Block 1: header [0x00, 0x02] + data [0xAA, 0xBB]
      // Block 2: header [0x0C, 0x82] (address 100 << 5 | 2) + data [0xCC, 0xDD]
      expect(result[0]).toEqual([
        0x00,
        0x02,
        0xAA,
        0xBB, // Block at address 0, size 2
        0x0C,
        0x82,
        0xCC,
        0xDD, // Block at address 100, size 2
      ])
    })

    it('should pack multiple non-contiguous read blocks into entries', () => {
      // 5 non-contiguous read blocks, each 2 bytes wireSize
      // Payload 6 bytes -> can fit 3 blocks per entry
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 5 },
        { address: 100, size: 5 },
        { address: 200, size: 5 },
        { address: 300, size: 5 },
        { address: 400, size: 5 },
      ]
      const result = packCommands('read', commands, 6)

      // 5 blocks x 2 bytes each = 10 bytes total
      // Entry 1: 3 blocks = 6 bytes
      // Entry 2: 2 blocks = 4 bytes
      expect(result.length).toBe(2)
      expect(result[0]!.length).toBe(6)
      expect(result[1]!.length).toBe(4)
    })

    it('should exactly fill payload with no wasted space', () => {
      // Payload 10, one block of exactly 10 bytes
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 8, value: [1, 2, 3, 4, 5, 6, 7, 8] }, // wireSize: 2 + 8 = 10
      ]
      const result = packCommands('write', commands, 10)

      expect(result.length).toBe(1)
      expect(result[0]!.length).toBe(10)
    })

    it('should handle complex scenario with many blocks and FFD optimization', () => {
      // Payload: 30 bytes
      // Blocks (sorted by size for FFD): 15, 12, 10, 8, 5
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 13, value: Array.from({ length: 13 }).fill(1) as number[] }, // wireSize: 15
        { address: 100, size: 10, value: Array.from({ length: 10 }).fill(2) as number[] }, // wireSize: 12
        { address: 200, size: 8, value: Array.from({ length: 8 }).fill(3) as number[] }, // wireSize: 10
        { address: 300, size: 6, value: Array.from({ length: 6 }).fill(4) as number[] }, // wireSize: 8
        { address: 400, size: 3, value: Array.from({ length: 3 }).fill(5) as number[] }, // wireSize: 5
      ]
      const result = packCommands('write', commands, 30)

      // FFD packing:
      // Entry 1: 15, can add 12? 27 <= 30 yes, can add 10? 37 > 30 no. Entry 1: 15+12=27
      // Entry 2: 10, can add 8? 18 <= 30 yes, can add 5? 23 <= 30 yes. Entry 2: 10+8+5=23
      // Total: 2 entries
      expect(result.length).toBe(2)

      // Verify total bytes
      const totalBytes = result.reduce((sum, entry) => sum + entry.length, 0)
      expect(totalBytes).toBe(15 + 12 + 10 + 8 + 5) // 50 bytes
    })

    it('should pack blocks that cannot be consolidated due to gaps', () => {
      // Contiguous blocks A, B at addresses 0-8
      // Gap
      // Contiguous blocks C, D at addresses 100-108
      // All should consolidate into 2 blocks, then pack
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 4, value: [1, 2, 3, 4] },
        { address: 4, size: 4, value: [5, 6, 7, 8] },
        { address: 100, size: 4, value: [9, 10, 11, 12] },
        { address: 104, size: 4, value: [13, 14, 15, 16] },
      ]
      const result = packCommands('write', commands, 50)

      // Consolidates to 2 blocks:
      // Block 1: address 0, size 8, wireSize 10
      // Block 2: address 100, size 8, wireSize 10
      // Both fit in 50-byte payload
      expect(result.length).toBe(1)
      expect(result[0]!.length).toBe(20)

      // Verify actual content
      expect(result[0]).toEqual([
        // Block at address 0, size 8
        0x00,
        0x08,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        // Block at address 100, size 8
        0x0C,
        0x88,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
      ])
    })

    it('should split 5 contiguous blocks when payload limits consolidation', () => {
      // 5 contiguous write commands, each size 4 = 20 bytes total
      // Payload 12 means maxDataSize = 12 - 2 = 10
      // Consolidation stops at 10 bytes:
      //   Block 1: addr 0, size 8 (4+4), wireSize 10
      //   Block 2: addr 8, size 8 (4+4), wireSize 10
      //   Block 3: addr 16, size 4, wireSize 6
      // FFD sorts: 10, 10, 6 (descending by wireSize)
      // Entry 1: 10, can add 10? 20 > 12 no, can add 6? 16 > 12 no. Just 10.
      // Entry 2: 10, can add 6? 16 > 12 no. Just 10.
      // Entry 3: 6.
      // Result: 3 entries
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 4, value: [1, 2, 3, 4] },
        { address: 4, size: 4, value: [5, 6, 7, 8] },
        { address: 8, size: 4, value: [9, 10, 11, 12] },
        { address: 12, size: 4, value: [13, 14, 15, 16] },
        { address: 16, size: 4, value: [17, 18, 19, 20] },
      ]
      const result = packCommands('write', commands, 12)

      expect(result.length).toBe(3)
      expect(result[0]!.length).toBe(10) // Block 1: header(2) + data(8)
      expect(result[1]!.length).toBe(10) // Block 2: header(2) + data(8)
      expect(result[2]!.length).toBe(6) // Block 3: header(2) + data(4)

      // Verify content
      expect(result[0]).toEqual([0x00, 0x08, 1, 2, 3, 4, 5, 6, 7, 8])
      expect(result[1]).toEqual([0x01, 0x08, 9, 10, 11, 12, 13, 14, 15, 16]) // addr 8 << 5 | 8 = 0x108
      expect(result[2]).toEqual([0x02, 0x04, 17, 18, 19, 20]) // addr 16 << 5 | 4 = 0x204
    })

    it('should split two contiguous groups and mix leftovers in FFD', () => {
      // 7 blocks total: 4 contiguous at 0-12, 3 contiguous at 100-112
      // Group A: addresses 0, 3, 6, 9 (each size 3) -> total 12 bytes
      // Group B: addresses 100, 104, 108 (each size 4) -> total 12 bytes
      // Payload 12 means maxDataSize = 10
      //
      // Group A consolidation (max 10):
      //   Block A1: addr 0, size 9 (3+3+3), wireSize 11
      //   Block A2: addr 9, size 3, wireSize 5
      // Group B consolidation (max 10):
      //   Block B1: addr 100, size 8 (4+4), wireSize 10
      //   Block B2: addr 108, size 4, wireSize 6
      //
      // FFD sorts by wireSize: A1(11), B1(10), B2(6), A2(5)
      // Entry 1: A1(11), can add B1(10)? 21 > 12 no, B2(6)? 17 > 12 no, A2(5)? 16 > 12 no. Just 11.
      // Entry 2: B1(10), can add B2(6)? 16 > 12 no, A2(5)? 15 > 12 no. Just 10.
      // Entry 3: B2(6), can add A2(5)? 11 <= 12 yes! Entry 3: 6+5 = 11.
      //
      // Result: 3 entries
      //   Entry 1: first part of group A (size 9)
      //   Entry 2: first part of group B (size 8)
      //   Entry 3: leftovers mixed (A2 size 3 + B2 size 4)
      const commands: WriteRegisterCommand[] = [
        // Group A: 4 contiguous commands
        { address: 0, size: 3, value: [1, 2, 3] },
        { address: 3, size: 3, value: [4, 5, 6] },
        { address: 6, size: 3, value: [7, 8, 9] },
        { address: 9, size: 3, value: [10, 11, 12] },
        // Group B: 3 contiguous commands
        { address: 100, size: 4, value: [21, 22, 23, 24] },
        { address: 104, size: 4, value: [25, 26, 27, 28] },
        { address: 108, size: 4, value: [29, 30, 31, 32] },
      ]
      const result = packCommands('write', commands, 12)

      expect(result.length).toBe(3)

      // Entry 1: Block A1 (addr 0, size 9) - wireSize 11
      expect(result[0]!.length).toBe(11)
      expect(result[0]).toEqual([0x00, 0x09, 1, 2, 3, 4, 5, 6, 7, 8, 9])

      // Entry 2: Block B1 (addr 100, size 8) - wireSize 10
      expect(result[1]!.length).toBe(10)
      expect(result[1]).toEqual([0x0C, 0x88, 21, 22, 23, 24, 25, 26, 27, 28]) // 100 << 5 | 8 = 0xC88

      // Entry 3: Mixed leftovers - B2 (addr 108, size 4) + A2 (addr 9, size 3)
      // FFD places larger first: B2(6) then A2(5)
      expect(result[2]!.length).toBe(11)
      // B2: addr 108 << 5 | 4 = 0xD84 -> [0x0D, 0x84]
      // A2: addr 9 << 5 | 3 = 0x123 -> [0x01, 0x23]
      expect(result[2]).toEqual([
        0x0D,
        0x84,
        29,
        30,
        31,
        32, // Block B2
        0x01,
        0x23,
        10,
        11,
        12, // Block A2
      ])
    })

    it('should handle read mode with multiple contiguous groups requiring split', () => {
      // Same scenario as above but for READ mode
      // READ wireSize is always 2 bytes regardless of size
      // Group A: 4 contiguous (addresses 0, 5, 10, 15 each size 5) = total 20
      // Group B: 3 contiguous (addresses 100, 105, 110 each size 5) = total 15
      // For READ: maxDataSize is always MAX_SIZE (31), so no consolidation split
      // Both groups consolidate fully:
      //   Block A: addr 0, size 20, wireSize 2
      //   Block B: addr 100, size 15, wireSize 2
      // Payload 3: can fit at most 1 block per entry (each is 2 bytes)
      const commands: ReadRegisterCommand[] = [
        { address: 0, size: 5 },
        { address: 5, size: 5 },
        { address: 10, size: 5 },
        { address: 15, size: 5 },
        { address: 100, size: 5 },
        { address: 105, size: 5 },
        { address: 110, size: 5 },
      ]
      const result = packCommands('read', commands, 3)

      // 2 consolidated blocks, each 2 bytes, but payload is 3
      // FFD: Entry 1: block A (2), can add block B (2)? 4 > 3 no. Just 2.
      // Entry 2: block B (2). Just 2.
      expect(result.length).toBe(2)
      expect(result[0]!.length).toBe(2)
      expect(result[1]!.length).toBe(2)

      // Block A: addr 0, size 20 -> 0 << 5 | 20 = 0x14 -> [0x00, 0x14]
      expect(result[0]).toEqual([0x00, 0x14])
      // Block B: addr 100, size 15 -> 100 << 5 | 15 = 0xC8F -> [0x0C, 0x8F]
      expect(result[1]).toEqual([0x0C, 0x8F])
    })

    it('should demonstrate consolidation limit causes more blocks than necessary', () => {
      // 3 contiguous commands that would be 1 block if not for size limit
      // Each size 12, total 36, but max is 31 for read (or payload-2 for write)
      // Payload 15 means write maxDataSize = 13
      // Block 1: size 12, Block 2: size 12, Block 3: size 12
      // None consolidate because 12+12=24 > 13
      // So we get 3 blocks, each wireSize 14
      // FFD with payload 15: each block fits alone
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 12, value: Array.from({ length: 12 }).fill(1) as number[] },
        { address: 12, size: 12, value: Array.from({ length: 12 }).fill(2) as number[] },
        { address: 24, size: 12, value: Array.from({ length: 12 }).fill(3) as number[] },
      ]
      const result = packCommands('write', commands, 15)

      // Each block: wireSize 14, none can share a 15-byte entry
      expect(result.length).toBe(3)
      expect(result[0]!.length).toBe(14)
      expect(result[1]!.length).toBe(14)
      expect(result[2]!.length).toBe(14)
    })

    it('should FFD pack isolated smaller block into remaining space of first entry', () => {
      // Three separate address spaces (non-contiguous)
      // Payload: 30 bytes
      // Block A (addr 0): ~60% of payload = 18 bytes (size 16 + header 2)
      // Block B (addr 100): ~50% of payload = 15 bytes (size 13 + header 2)
      // Block C (addr 200): ~30% of payload = 9 bytes (size 7 + header 2)
      //
      // FFD sorts by wireSize: A(18), B(15), C(9)
      // Entry 1: A(18), remaining 12. Can B(15) fit? No. Can C(9) fit? Yes!
      //          Entry 1: A + C = 27 bytes
      // Entry 2: B(15)
      //
      // Key assertion: The 3rd isolated block (C) gets packed into the gap
      // left by the 1st block (A), even though they're from different address spaces.
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 16, value: Array.from({ length: 16 }).fill(0xAA) as number[] }, // wireSize: 18
        { address: 100, size: 13, value: Array.from({ length: 13 }).fill(0xBB) as number[] }, // wireSize: 15
        { address: 200, size: 7, value: Array.from({ length: 7 }).fill(0xCC) as number[] }, // wireSize: 9
      ]
      const result = packCommands('write', commands, 30)

      // Should be 2 entries, not 3!
      expect(result.length).toBe(2)

      // Entry 1: Block A (18) + Block C (9) = 27 bytes
      expect(result[0]!.length).toBe(27)

      // Entry 2: Block B (15)
      expect(result[1]!.length).toBe(15)

      // Verify Entry 1 contains blocks from addr 0 AND addr 200 (mixed!)
      // Block A: addr 0 << 5 | 16 = 0x010 -> [0x00, 0x10]
      // Block C: addr 200 << 5 | 7 = 0x1907 -> [0x19, 0x07]
      expect(result[0]!.slice(0, 2)).toEqual([0x00, 0x10]) // Block A header
      expect(result[0]!.slice(18, 20)).toEqual([0x19, 0x07]) // Block C header (after A's 18 bytes)

      // Verify Entry 2 contains only block from addr 100
      // Block B: addr 100 << 5 | 13 = 0xC8D -> [0x0C, 0x8D]
      expect(result[1]!.slice(0, 2)).toEqual([0x0C, 0x8D])

      // Verify total bytes
      expect(result[0]!).toEqual([
        0x00,
        0x10,
        ...Array.from({ length: 16 }).fill(0xAA),
        0x19,
        0x07,
        ...Array.from({ length: 7 }).fill(0xCC),
      ])
      expect(result[1]!).toEqual([
        0x0C,
        0x8D,
        ...Array.from({ length: 13 }).fill(0xBB),
      ])
    })

    it('should NOT avoid consolidation to fill gaps (future optimization)', () => {
      // This test documents current behavior and will CHANGE when we implement
      // the optimization to avoid consolidation for better packing.
      //
      // Scenario: Two large blocks A and B, plus two small contiguous commands C1 and C2
      // Payload: 20 bytes
      // Block A (addr 0): 60% of payload = 12 bytes (size 10 + header 2)
      // Block B (addr 100): 60% of payload = 12 bytes (size 10 + header 2)
      // Commands C1 (addr 200, size 4) and C2 (addr 204, size 4) - contiguous!
      //
      // CURRENT BEHAVIOR:
      //   C1 and C2 are consolidated into Block C (addr 200, size 8, wireSize 10)
      //   After A and B placed, each entry has 8 bytes remaining.
      //   Block C (10 bytes) doesn't fit in either 8-byte gap.
      //   Result: 3 entries
      //     Entry 1: A (12)
      //     Entry 2: B (12)
      //     Entry 3: C (10)
      //
      // FUTURE OPTIMIZED BEHAVIOR:
      //   Don't consolidate C1 and C2, keep them separate:
      //     C1: addr 200, size 4, wireSize 6
      //     C2: addr 204, size 4, wireSize 6
      //   Each fits in an 8-byte gap!
      //   Result: 2 entries
      //     Entry 1: A (12) + C1 (6) = 18 bytes
      //     Entry 2: B (12) + C2 (6) = 18 bytes
      //
      // Trade-off: 2 extra header bytes (36 vs 34 total) but 1 fewer transmission
      //
      // TODO: When "smart consolidation" optimization is implemented, change expect to 2
      const commands: WriteRegisterCommand[] = [
        { address: 0, size: 10, value: Array.from({ length: 10 }).fill(0xAA) as number[] }, // wireSize: 12
        { address: 100, size: 10, value: Array.from({ length: 10 }).fill(0xBB) as number[] }, // wireSize: 12
        // Two contiguous commands that will be consolidated into one block
        { address: 200, size: 4, value: [0xC1, 0xC1, 0xC1, 0xC1] }, // wireSize: 6 if kept separate
        { address: 204, size: 4, value: [0xC2, 0xC2, 0xC2, 0xC2] }, // wireSize: 6 if kept separate
      ]
      const result = packCommands('write', commands, 20)

      // CURRENT: 3 entries (C1 + C2 consolidated into one block that doesn't fit gaps)
      expect(result.length).toBe(3)

      // Entry 1: Block A alone (12 bytes)
      expect(result[0]!.length).toBe(12)
      // Entry 2: Block B alone (12 bytes)
      expect(result[1]!.length).toBe(12)
      // Entry 3: Consolidated Block C (10 bytes) - addr 200, size 8
      expect(result[2]!.length).toBe(10)
      expect(result[2]).toEqual([0x19, 0x08, 0xC1, 0xC1, 0xC1, 0xC1, 0xC2, 0xC2, 0xC2, 0xC2])

      // Verify total bytes = 34 (would be 36 with smart non-consolidation, but only 2 entries)
      const totalBytes = result.reduce((sum, entry) => sum + entry.length, 0)
      expect(totalBytes).toBe(34)

      // FUTURE: Uncomment when smart consolidation optimization is implemented
      // expect(result.length).toBe(2)
      // expect(result[0]!.length).toBe(18) // A + C1
      // expect(result[1]!.length).toBe(18) // B + C2
    })
  })
})
