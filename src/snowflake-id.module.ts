import { type DynamicModule } from '@nestjs/common'
import { type SnowflakeIdOptions } from '@street-devs/snowflake-id'
import { SnowflakeIdService } from './snowflake-id.service'

export class SnowflakeIdModule {
  public static forRoot(
    options?: SnowflakeIdOptions & { global?: boolean }
  ): DynamicModule {
    return {
      module: SnowflakeIdModule,
      providers: [
        {
          provide: SnowflakeIdService,
          useValue: new SnowflakeIdService(options),
        },
      ],
      exports: [SnowflakeIdService],
      global: options?.global || false,
    }
  }
}
