import { Injectable } from "@nestjs/common"
import { SnowflakeId, SnowflakeIdOptions } from "./lib"

@Injectable()
export class SnowflakeIdService {
  private readonly _snowflakeId: SnowflakeId

  public constructor(options?: SnowflakeIdOptions) {
    this._snowflakeId = new SnowflakeId(options)
  }

  public generate() {
    return this._snowflakeId.generate()
  }

  public decode(id: bigint) {
    return this._snowflakeId.decode(id)
  }
}
