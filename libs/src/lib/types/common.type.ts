import { Request } from 'express';
import {
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  UpdateResult,
} from 'typeorm';

export interface IBaseService<T> {
  findAll(options: FindManyOptions<T>): Promise<T[]>;

  findOne(options: FindOneOptions<T>): Promise<T | null>;

  store(data: any): Promise<T>;

  update(
    id: string,
    data: any,
    options: FindOneOptions<T>,
  ): Promise<UpdateResult>;

  delete(id: string): Promise<DeleteResult>;

  query(queryObj: any, options?: QueryOptions): Promise<QueryResult<T>>;

  search(queryObj: any, options?: QueryOptions): Promise<QueryResult<T>>;
}

export interface QueryOptions {
  relations?: string[];
}

export interface FindOptions {
  relations?: string[];
}

export interface QueryResult<T> {
  page: number;
  limit: number;
  total: number;
  data: T[];
}

export interface Pagination<T> {
  page: number;
  limit: number;
  total: number;
  items: T;
}

export type JwtPayload = {
  userId: string;
  email: string;
};

export type UserDecoratorParam = keyof JwtPayload | 'role' | undefined;

export interface RequestWithUser extends Request {
  user?: JwtPayload;
  role?: string;
}
