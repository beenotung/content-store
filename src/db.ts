import DB from 'better-sqlite3-helper'
import { DBInstance, toSafeMode } from 'better-sqlite3-schema'
import { join } from 'path'

export function createDB(path = join('data', 'sqlite3.db')): DBInstance {
  const db = DB({
    path,
    migrate: {
      migrationsPath: 'migrations',
      table: 'migrations',
      force: false,
    },
  })

  toSafeMode(db)

  return db
}
