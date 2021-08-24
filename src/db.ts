import { DBInstance, toSafeMode, newDB } from 'better-sqlite3-schema'
import { join } from 'path'

export function createDB(path = join('data', 'sqlite3.db')): DBInstance {
  const basedir = __filename.endsWith('.ts')
    ? join(__dirname, '..') // src
    : join(__dirname, '..', '..') // dist/cjs
  const migrationsPath = join(basedir, 'migrations')
  const db = newDB({
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
