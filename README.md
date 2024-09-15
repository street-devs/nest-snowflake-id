# NestJS Snowflake ID

### A simple and light-weight package provides support for creating/decoding Snowflake ID

A simple and lightweight package designed to seamlessly integrate with NestJS, providing efficient support for creating and decoding Snowflake IDs. 
Snowflake IDs are unique, time-based identifiers often used in distributed systems to ensure scalability and uniqueness across environments. 
This package ensures easy integration, offering developers the tools to generate and decode Snowflake IDs within their NestJS applications effortlessly.

## Installation
First, install NotificationsModule into your project using the `npm`:

```shell
npm install --save @street-devs/nest-snowflake-id
```

### Register `SnowflakeIdModule` to your application module

```
import { SnowflakeIdModule } from '@street-devs/nest-nest-snowflake-id'

@Module({
  imports: [
    SnowflakeIdModule.forRoot({}),
  ],
  ...
})
export class AppModule {}
```