// @flow

import { assign as lassign, concat, fromPairs, map, flow, partial, partialRight } from 'lodash'
import { autorun, map as obsMap, createTransformer } from 'mobx'
import { addKey, createData, init, update } from './util'
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

  function db(key: string, funcs?: Array<Function> | Function): Object {
    // If the observable array doesn't exist create it
    if (!dbObject.has(key)) dbObject.set(key, createData(dbObject, key, []))
    if (funcs) {
      return addKey(chain(dbObject.get(key).__data, funcs), key)
    }
    return addKey(dbObject.get(key).obs.slice(), key)
  }
  db.states = states
  db.chain = chain

  function chain(data: Object, funcs?: Array<Function> | Function): Object {
    return flow(...concat([], funcs), partial(update, dbObject, data.__key))(data)
  }

  // Return the database object
  return db
}

// Use because lodash-fp doesn't allow mutation
export function assign(newValue: any): Function {
  return partialRight(lassign, newValue)
}
