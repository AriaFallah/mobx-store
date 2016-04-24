// @flow

import { concat, flow, map, partial, forOwn } from 'lodash'
import { autorun, map as obsMap, toJSON, transaction } from 'mobx'

export default function createDb(intitialState: Object = {}): Function {
  const dbObject = obsMap(intitialState)
  const state = { past: [], present: dbObject, future: [] }
  let shouldObserve = true

  autorun(function() {
    if (shouldObserve) {
      state.future = []
      state.past.push(toJSON(state.present))
    } else {
      shouldObserve = true
    }
  })

  function db(key: string, funcs?: Array<Function> | Function): Object {
    if (!dbObject.has(key)) state.present.set(key, [])
    if (funcs) {
      return chain(state.present.get(key), funcs)
    }
    return state.present.get(key)
  }
  db.chain = chain
  db.object = state.present
  db.redo = redo
  db.schedule = schedule
  db.state = state
  db.undo = undo

  function undo() {
    if (state.past.length === 1) {
      throw new Error('Can not call undo when you have not made any changes')
    }

    shouldObserve = false
    state.future.push(toJSON(state.present))
    transaction(function() {
      state.past.pop() // hacky
      forOwn(state.past.pop(), (value, key) => state.present.set(key, value))
    })
  }

  function redo() {
    if (state.future.length === 0) {
      throw new Error('Can not call redo when you have not called undo')
    }

    shouldObserve = false
    state.past.push(toJSON(state.present))
    transaction(() => forOwn(state.future.shift(), (value, key) => state.present.set(key, value)))
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
