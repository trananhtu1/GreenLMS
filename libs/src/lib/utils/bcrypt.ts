import * as bcrypt from 'bcrypt';

export function encodePassword(password: string) {
  const SALT = bcrypt.genSaltSync();

  return bcrypt.hashSync(password, SALT);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}
