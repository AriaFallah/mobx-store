// @flow

import { concat, fromPairs, map, flow } from 'lodash'
import { autorun, map as obsMap, createTransformer, observable } from 'mobx'
import { init } from './util'
import type { StoreOptions } from './types'

const serializeDb = createTransformer(function(db) {
  return fromPairs(map(db.entries(), (v) => [v[0], v[1].slice()]))
})

export default function createDb(source: string, options: StoreOptions = {}): Function {
  let dbObject
  const states = observable([])
  const storage = options && options.storage

  if (storage) {
    dbObject = init(source, storage.read, storage.write)
  } else {
    dbObject = obsMap({})
  }

  autorun(function() {
    states.push(serializeDb(dbObject))
  })

  function db(key: string, funcs?: Array<Function> | Function): Object {
    // If the observable array doesn't exist create it
    if (!dbObject.has(key)) dbObject.set(key, [])
    if (funcs) {
      return chain(dbObject.get(key), funcs)
    }
    return dbObject.get(key)
  }
  db.states = states
  db.chain = chain

  function chain(data: Object, funcs?: Array<Function> | Function): Object {
    return flow(...concat([], funcs))(data.slice())
  }

  // Return the database object
  return db
}
