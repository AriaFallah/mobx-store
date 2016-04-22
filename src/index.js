// @flow

import _ from 'lodash'
import { autorun, map, createTransformer } from 'mobx'
import { createData, init } from './util'
import type { StoreOptions } from './types'

const serializeDb = createTransformer(function(db) {
  return _.fromPairs(_.map(db.entries(), (v) => [v[0], v[1].obs.slice()]))
})

export default function createDb(source: string, options: StoreOptions = {}): Function {
  let dbObject
  const states = []
  const storage = options && options.storage

  if (storage) {
    dbObject = init(source, storage.read, storage.write)
  } else {
    dbObject = map({})
  }

  autorun(function() {
    states.push(serializeDb(dbObject))
  })

  function db(key: string): Array<any> {
    // If the observable array doesn't exist create it
    if (!dbObject.has(key)) dbObject.set(key, createData(dbObject, key, []))
    return dbObject.get(key).__data
  }
  db.states = states

  // Return the database object
  return db
}
