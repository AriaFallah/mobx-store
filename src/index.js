// @flow

import { assign, concat, fromPairs, map, flow, partial, partialRight } from 'lodash'
import { autorun, map as obsMap, createTransformer } from 'mobx'
import { createData, init, update } from './util'
import type { StoreOptions } from './types'

const serializeDb = createTransformer(function(db) {
  return fromPairs(map(db.entries(), (v) => [v[0], v[1].obs.slice()]))
})

export default function createDb(source: string, options: StoreOptions = {}): Function {
  let dbObject
  const states = []
  const storage = options && options.storage

  if (storage) {
    dbObject = init(source, storage.read, storage.write)
  } else {
    dbObject = obsMap({})
  }

  autorun(function() {
    states.push(serializeDb(dbObject))
  })

  function db(key: string, funcs?: Array<Function> | Function): Array<any> {
    // If the observable array doesn't exist create it
    if (!dbObject.has(key)) dbObject.set(key, createData(dbObject, key, []))
    if (funcs) {
      return chain(key, dbObject.get(key).__data, funcs)
    }
    return dbObject.get(key).obs.slice()
  }
  db.states = states
  db.chain = chain

  function chain(key: string, data: Array<any>, funcs?: Array<Function> | Function) {
    return flow(...concat([], funcs), partial(update, dbObject, key))(data)
  }

  // Return the database object
  return db
}

// Use because lodash-fp doesn't allow mutation
export function mutate(newValue: any): Function {
  return partialRight(assign, newValue)
}
