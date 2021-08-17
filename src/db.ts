import DB from 'better-sqlite3-helper'
import { DBInstance, toSafeMode } from 'better-sqlite3-schema'
import { join } from 'path'

export function createDB(path = join('data', 'sqlite3.db')): DBInstance {
  const basedir = __filename.endsWith('.ts')
    ? join(__dirname, '..') // src
    : join(__dirname, '..', '..') // dist/cjs
  const migrationsPath = join(basedir, 'migrations')
  const db = DB({
    path,
    migrate: {
      migrationsPath,
      table: 'migrations',
      force: false,
    },
  })

  toSafeMode(db)

  return db
}
