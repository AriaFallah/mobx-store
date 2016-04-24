// @flow

import { concat, flow, map, mapValues, partial } from 'lodash'
import { autorun, observable, observe } from 'mobx'

export default function createDb(intitialState: Object = {}): Function {
  const dbObject = mapValues(intitialState, createData)

  function db(key: string, funcs?: Array<Function> | Function): Object {
    if (!dbObject[key]) dbObject[key] = createData([])
    if (funcs) {
      return chain(dbObject[key], funcs)
    }
    return dbObject[key]
  }
  db.chain = chain
  db.object = dbObject
  db.redo = redo
  db.schedule = schedule
  db.undo = undo

  function undo(key: string) {
    const obs = dbObject[key]
    obs.__past.pop() // hacky
    obs.__shouldUpdate = false
    obs.__future.push(obs.slice())
    obs.replace(obs.__past.pop())
  }

  function redo(key: string) {
    const obs = dbObject[key]
    obs.__shouldUpdate = false
    obs.__past.push(obs.slice())
    obs.replace(obs.__future.shift())
  }

  // Return the database object
  return db
}

export function chain(data: Object, funcs: Array<Function> | Function): Object {
  return flow(...concat([], funcs))(data.slice())
}

export function schedule(...funcs: Array<Function>) {
  return map(map(funcs, (args) => partial(...args)), autorun)
}

function createData(data: any) {
  const obs = Object.defineProperties(observable(data), {
    __past: { value: [], writable: true },
    __future: { value: [], writable: true },
    __shouldUpdate: { value: true, writable: true }
  })
  observe(obs, function() {
    if (obs.__shouldUpdate) {
      obs.__future = []
      obs.__past.push(obs.slice())
    } else {
      obs.__shouldUpdate = true
    }
  })
  return obs
}
