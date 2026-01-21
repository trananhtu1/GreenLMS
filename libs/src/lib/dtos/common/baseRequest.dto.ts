import { plainToClass } from 'class-transformer';

export abstract class BaseRequestDto {
  static plainToClass<T>(this: new (...args: any[]) => T, entity: any): T {
    return plainToClass(this, entity);
  }
}
