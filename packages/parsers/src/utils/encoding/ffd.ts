/**
 * First Fit Decreasing (FFD) bin packing algorithm.
 *
 * Sorts packets in decreasing order by size and greedily packs them into bins,
 * placing each packet into the first bin that has sufficient remaining capacity.
 * Float limits are converted to integers using `Math.floor`.
 *
 * @param packets - Array of packets (byte arrays) to be packed into bins.
 * @param limit - Maximum byte capacity per bin. Floats are floored to integers.
 * @returns Array of packed bins, each containing one or more packets.
 *
 * @throws {Error} If limit is less than or equal to 0.
 * @throws {Error} If any single packet exceeds the bin limit.
 *
 * @example
 * const packets = [[1, 2], [3, 4, 5], [6]]
 * const result = ffd(packets, 5)
 * // Output: [[3, 4, 5, 1, 2], [6]]
 */
export function ffd(packets: number[][], limit: number): number[][] {
  limit = Math.floor(limit)

  if (limit <= 0) {
    throw new Error('Limit must be greater than 0')
  }

  const bins: number[][] = []

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
