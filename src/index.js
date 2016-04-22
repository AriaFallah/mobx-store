// @flow

import { map } from 'mobx'
import { createData, init } from './util'

function createDb(source: string, options: Object = {}): Function {
  let dbObject
  const storage = options && options.storage

  if (storage) {
    dbObject = init(source, storage.read, storage.write)
  } else {
    dbObject = map({})
  }

  function db(key: string): Array<any> {
    // If the observable array doesn't exist create it
    if (!dbObject.has(key)) dbObject.set(key, createData(dbObject, key, []))
    return dbObject.get(key).__data
  }

  // Return the database object
  return db
}

export default createDb
