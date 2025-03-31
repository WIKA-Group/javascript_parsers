import type { Frame } from './shared'

/**
 * First Fit Decreasing algorithm
 *
 * This function sorts the packets in decreasing order of their size and then tries to fit them into bins
 * with a specified size limit. It handles float limits by using Math.floor to convert them to integers.
 *
 * @param packets - An array of packets (frames) to be packed into bins.
 * @param limit - The size limit of each bin. If a float is provided, it will be floored to the nearest integer.
 * @returns An array of bins, each containing packets that fit within the specified limit.
 *
 * @throws Will throw an error if the limit is less than or equal to 0.
 * @throws Will throw an error if any packet is too big to fit in any bin.
 *
 * @example
 * const packets: Frame[] = [[1, 2], [3, 4], [5, 6]]
 * const result = FirstFitDecreasing(packets, 10)
 * console.log(result) // Output: [[1, 2, 3, 4, 5, 6]]
 */
export function FirstFitDecreasing(packets: Frame[], limit: number): Frame[] {
  limit = Math.floor(limit)
  if (limit <= 0) {
    throw new Error('Limit must be greater than 0')
  }

  const bins: Frame[] = []

  // sort packets in decreasing order
  const sorted = packets.sort((a, b) => b.length - a.length)

  sorted.forEach((packet) => {
    const packetLength = packet.length
    if (packetLength > limit) {
      throw new Error('Packet is too big to fit in any bin')
    }

    // iterate over all bins and check if it fits
    let found = false
    for (const bin of bins) {
      if (limit - bin.length >= packetLength) {
        bin.push(...packet)
        found = true
        break
      }
    }
    if (!found) {
      bins.push(packet)
    }
  })

  return bins
}
