declare global {
  interface BigInt {
    toJSON(): number
  }
}

// TOTAL_BITS is the total number of bits that the ID can have
const TOTAL_BITS = 64n

// EPOCH_BITS is the total number of bits that are occupied by the UNIX timestamp
const EPOCH_BITS = 42n

// INSTANCE_ID_BITS is the total number of bits that are occupied by the node id
const INSTANCE_ID_BITS = 12n

// SEQUENCE_BITS is the total number of bits that are occupied by the sequence ids
const SEQUENCE_BITS = 10n

const MAX_INSTANCE_ID = (1n << INSTANCE_ID_BITS) - 1n
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n

BigInt.prototype.toJSON = function () {
  return Number(this)
}

export interface SnowflakeIdOptions {
  customEpoch?: number
  instanceId?: number
}

export class SnowflakeId {
  private _lastTimestamp: bigint
  private _customEpoch: number
  private _sequence: bigint
  private _instanceId: bigint

  public constructor(opts?: SnowflakeIdOptions) {
    const epoch = opts?.customEpoch || currentTime(0)
    const instanceId = BigInt(
      opts?.instanceId || random(Number(MAX_INSTANCE_ID))
    )

    if (instanceId > MAX_INSTANCE_ID) {
      throw new Error(`instanceId must be between 0 and ${MAX_INSTANCE_ID}`)
    }

    this._lastTimestamp = 0n
    this._customEpoch = epoch
    this._sequence = 0n
    this._instanceId = instanceId & MAX_INSTANCE_ID
  }

  /**
   * Generates a 64-bit unique ID.
   */
  public generate(): bigint {
    let currentTimestamp = BigInt(currentTime(this._customEpoch))

    if (currentTimestamp === this._lastTimestamp) {
      this._sequence = (this._sequence + 1n) & MAX_SEQUENCE

      if (this._sequence === 0n) {
        while (
          BigInt(currentTime(this._customEpoch)) - currentTimestamp <
          1n
        ) {}
        currentTimestamp += 1n
      }
    } else {
      this._sequence = 0n
    }

    this._lastTimestamp = currentTimestamp

    let id = currentTimestamp << (TOTAL_BITS - EPOCH_BITS)
    id |= this._instanceId << (TOTAL_BITS - EPOCH_BITS - INSTANCE_ID_BITS)
    id |= this._sequence

    return id
  }

  /**
   * Decodes a given Snowflake ID and returns its components: timestamp, instanceId, and sequence.
   * @param {bigint} id - The Snowflake ID to decode.
   */
  public decode(id: bigint) {
    // Extract the timestamp
    const timestamp =
      (id >> (TOTAL_BITS - EPOCH_BITS)) + BigInt(this._customEpoch)

    // Extract the instance ID
    const instanceId = (id >> SEQUENCE_BITS) & MAX_INSTANCE_ID

    // Extract the sequence number
    const sequence = id & MAX_SEQUENCE

    return {
      timestamp: new Date(Number(timestamp)),
      instanceId: Number(instanceId),
      sequence: Number(sequence),
    }
  }

  public get instanceId() {
    return this._instanceId
  }

  public get customEpoch() {
    return this._customEpoch
  }
}

/**
 * Returns the current time in milliseconds, adjusted by the given parameter.
 * @param {number} adjust - The adjustment to subtract from the current time.
 */
function currentTime(adjust: number): number {
  return Math.round(Date.now()) - adjust
}

/**
 * Generates a random number between [0, scale].
 * @param {number} scale - The upper limit for the random number.
 */
function random(scale: number): number {
  return Math.floor(Math.random() * scale)
}
