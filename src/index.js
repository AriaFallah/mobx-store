// @flow

import { concat, fromPairs, map, flow } from 'lodash'
import { autorun, map as obsMap, createTransformer, observable } from 'mobx'

const serializeDb = createTransformer(function(db) {
  return fromPairs(map(db.entries(), (v) => [v[0], v[1].slice()]))
})

export default function createDb(intitialState: Object = {}): Function {
  const dbObject = obsMap(intitialState)
  const states = observable([])

  autorun(() => states.push(serializeDb(dbObject)))

  function db(key: string, funcs?: Array<Function> | Function): Object {
    if (!dbObject.has(key)) dbObject.set(key, [])
    if (funcs) {
      return chain(dbObject.get(key), funcs)
    }
    return dbObject.get(key)
  }
  db.object = dbObject
  db.chain = chain
  db.register = register
  db.states = states

  function chain(data: Object, funcs?: Array<Function> | Function): Object {
    return flow(...concat([], funcs))(data.slice())
  }

  function register(funcs?: Array<Function> | Function) {
    return map(concat([], funcs), autorun)
  }

  // Return the database object
  return db
}
