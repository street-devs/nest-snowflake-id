declare global {
  interface BigInt {
    toJSON(): number
  }
}

BigInt.prototype.toJSON = function () {
  return Number(this)
}

export interface SnowflakeIdOptions {
  customEpoch?: number
  machineId?: number
  workerId?: number
}

export interface SnowflakeIdDecoded {
  dateTime: Date
  timestamp: bigint
  dataCenterId: bigint
  workerId: bigint
  sequence: bigint
  epoch: number
}

export class SnowflakeId {
  private _lastTimestamp: bigint
  private _customEpoch: number
  private _sequence: bigint

  private _workerId: bigint
  private _dataCenterId: bigint

  public readonly DEFAULT_EPOCH_DATETIME = new Date(
    '2024-01-01T00:00:00Z'
  ).getTime()

  /**
   * The total number of bits for a Snowflake ID is typically fixed at 64 bits by design.
   * Modifying totalBits might lead to unexpected behavior or inconsistencies when encoding and decoding Snowflake IDs
   * since the structure of Snowflake IDs is based on this fixed 64-bit structure (with specific bits assigned to timestamp, instance ID, and sequence).
   */
  public readonly TOTAL_BITS: bigint = 64n

  public readonly EPOCH_BITS: bigint = 42n
  public readonly WORKER_ID_BITS: bigint = 5n
  public readonly DATA_CENTER_ID_BITS: bigint = 5n
  public readonly SEQUENCE_BITS: bigint = 12n

  public readonly MAX_WORKER_ID: bigint = (1n << this.WORKER_ID_BITS) - 1n
  public readonly MAX_DATA_CENTER_ID: bigint =
    (1n << this.DATA_CENTER_ID_BITS) - 1n

  public readonly MAX_SEQUENCE: bigint = (1n << this.SEQUENCE_BITS) - 1n

  public get machineId() {
    return {
      workerId: this._workerId,
      dataCenterId: this._dataCenterId,
    }
  }

  public get customEpoch() {
    return this._customEpoch
  }

  public constructor(opts?: SnowflakeIdOptions) {
    const workerId = BigInt(
      opts?.machineId ?? random(Number(this.MAX_WORKER_ID))
    )

    if (workerId > this.MAX_WORKER_ID) {
      throw new RangeError(
        `Worker ID must be between 0 and ${this.MAX_WORKER_ID}`
      )
    }

    const dataCenterId = BigInt(
      opts?.machineId ?? random(Number(this.MAX_DATA_CENTER_ID))
    )

    if (dataCenterId > this.MAX_DATA_CENTER_ID) {
      throw new RangeError(
        `Data Center ID must be between 0 and ${this.MAX_DATA_CENTER_ID}`
      )
    }

    this._customEpoch = opts?.customEpoch || this.DEFAULT_EPOCH_DATETIME
    this._lastTimestamp = 0n
    this._sequence = 0n

    this._workerId = workerId & this.MAX_WORKER_ID
    this._dataCenterId = dataCenterId & this.MAX_DATA_CENTER_ID
  }

  /**
   * Generates a 64-bit unique ID.
   */
  public generate(): bigint {
    const currentTimestamp = BigInt(currentTime(this._customEpoch))

    this.makeSequence(currentTimestamp)

    const timestampLeftShift = this.TOTAL_BITS - this.EPOCH_BITS
    const dataCenterIdLeftShift =
      timestampLeftShift - this.DATA_CENTER_ID_BITS - this.WORKER_ID_BITS
    const workerIdLeftShift = dataCenterIdLeftShift - this.SEQUENCE_BITS

    return (
      (currentTimestamp << timestampLeftShift) |
      (this._dataCenterId << dataCenterIdLeftShift) |
      (this._workerId << workerIdLeftShift) |
      this._sequence
    )
  }

  /**
   * Decodes a given Snowflake ID and returns its components: timestamp, machineId, and sequence.
   * @param {bigint} id - The Snowflake ID to decode.
   */
  public decode(id: bigint): SnowflakeIdDecoded {
    // Extract the timestamp
    const timestamp =
      (id >> (this.TOTAL_BITS - this.EPOCH_BITS)) + BigInt(this._customEpoch)

    // Extract the dataCenterId (5 bits)
    const dataCenterId =
      (id >> (this.WORKER_ID_BITS + this.SEQUENCE_BITS)) &
      this.MAX_DATA_CENTER_ID

    // Extract the workerId (5 bits)
    const workerId = (id >> this.SEQUENCE_BITS) & this.MAX_WORKER_ID

    // Extract the sequence number (12 bits)
    const sequence = id & this.MAX_SEQUENCE

    return {
      dateTime: new Date(Number(timestamp)),
      timestamp,
      dataCenterId: dataCenterId,
      workerId: workerId,
      sequence: sequence,
      epoch: this._customEpoch,
    }
  }

  protected makeSequence(currentTimestamp: bigint) {
    if (currentTimestamp !== this._lastTimestamp) {
      this._sequence = 0n

      return this._sequence
    }

    this._sequence = (this._sequence + 1n) & this.MAX_SEQUENCE

    // Sequence overflow, wait until next millisecond
    if (this._sequence === 0n) {
      this._lastTimestamp = waitUntilNextMillisecond(
        this._customEpoch,
        currentTimestamp
      )
    }

    return this._sequence
  }
}

/**
 * Returns the current time in milliseconds, adjusted by the given parameter.
 * @param {number} adjust - The adjustment to subtract from the current time.
 */
function currentTime(adjust: number): number {
  return Date.now() - adjust
}

/**
 * Generates a random number between [0, scale].
 * @param {number} scale - The upper limit for the random number.
 */
function random(scale: number): number {
  return Math.floor(Math.random() * scale)
}

function waitUntilNextMillisecond(
  customEpoch: number,
  currentTimestamp: bigint
) {
  let nextTimestamp = BigInt(currentTime(customEpoch))

  while (nextTimestamp - currentTimestamp < 1n) {
    nextTimestamp = BigInt(currentTime(0))
  }

  return nextTimestamp
}
