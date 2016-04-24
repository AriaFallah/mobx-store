// @flow

import { concat, flow, map, partial, forOwn } from 'lodash'
import { autorun, observable } from 'mobx'

export default function createDb(intitialState: Object = {}): Function {
  const state = { past: [], present: observable(intitialState), future: [] }

  function db(key: string, funcs?: Array<Function> | Function): Object {
    if (!state.present[key]) state.present[key] = observable([])
    if (funcs) {
      return chain(state.present[key], funcs)
    }
    return state.present[key]
  }
  db.chain = chain
  db.object = state.present
  db.redo = redo
  db.schedule = schedule
  db.state = state
  db.undo = undo

  function undo() {

  }

  function redo() {

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
