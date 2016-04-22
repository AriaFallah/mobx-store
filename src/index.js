// @flow

import { map } from 'mobx'
import { createData } from './util'

function createDb(source: string, options: Object = {}): Function {
  let dbObject
  const storage = options && options.storage

  if (storage) {
    db.read = storage.read
    db.write = storage.write
    dbObject = init(db.read, db.write)
  } else {
    dbObject = map({})
  }

  function db(key: string): Array<any> {
    // If the observable array doesn't exist create it
    if (!dbObject.has(key)) dbObject.set(key, createData(dbObject, key, []))
    return dbObject.get(key).__data
  }

  function init(read: Function, write: Function): Object {
    // noop for now
    console.log(read, write)
    return {}
  }

  // Return the database object
  return db
}

export default createDb
