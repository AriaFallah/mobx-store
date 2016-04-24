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
    if (obs === undefined) {
      throw new Error('You cannot call undo on a nonexistent collection')
    }
    if (obs.__past.length === 0) {
      throw new Error('You cannot call undo if you have not made any changes')
    }
    obs.__past.pop() // hacky
    obs.__shouldUpdate = false
    obs.__future.push(obs.slice())
    obs.replace(obs.__past.pop())
  }

  function redo(key: string) {
    const obs = dbObject[key]
    if (obs === undefined) {
      throw new Error('You cannot call redo on a nonexistent collection')
    }
    if (obs.__future.length === 0) {
      throw new Error('You cannot call redo without having called undo first')
    }
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
