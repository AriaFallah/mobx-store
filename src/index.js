// @flow

import { concat, flow, map, mapValues, partial, partialRight } from 'lodash'
import { action, autorun, asMap, observable, observe, toJS } from 'mobx'
import type { StoreConfig, SpliceChange, UpdateChange } from './types'

const defaultConfig = {
  historyLimit: Infinity,
  noHistory: false,
}

export default function(intitialState: Object = {}, userConfig?: StoreConfig = {}): Function {
  const config = { ...defaultConfig, ...userConfig }
  const create = config.noHistory ? createDataWithoutHistory : partialRight(createData, config.historyLimit)
  const dbObject = observable(asMap(mapValues(intitialState, (value) => create(value))))

  function db(key: string, funcs?: Array<Function> | Function): Object {
    if (!dbObject.get(key)) throw new Error('Tried to retrieve undefined key')
    if (funcs) {
      return chain(dbObject.get(key), funcs)
    }
    return dbObject.get(key)
  }
  db.canRedo = (key: string): boolean => dbObject.get(key).__future.length > 0
  db.canUndo = (key: string): boolean => dbObject.get(key).__past.length > 0
  db.contents = (): Object => toJS(dbObject)
  db.set = action((key: string, value: Array<any> | Object): void => dbObject.set(key, create(value)))
  db.redo = action(redo)
  db.undo = action(undo)
  db.chain = chain
  db.object = dbObject
  db.schedule = schedule

  function undo(key: string): void {
    const obs = dbObject.get(key)
    if (!db.canUndo(key)) {
      throw new Error('You cannot call undo if you have not made any changes')
    }

    // undo shouldn't trigger a push to history
    obs.__trackChanges = false
    obs.__future.push(revertChange(obs, obs.__past.pop()))
  }

  function redo(key: string): void {
    const obs = dbObject.get(key)
    if (!db.canRedo(key)) {
      throw new Error('You cannot call redo without having called undo first')
    }

    // redo shouldn't trigger a push to history
    obs.__trackChanges = false
    obs.__past.push(revertChange(obs, obs.__future.pop()))
  }

  // Return the database object
  return db
}

export function chain(data: Object, funcs: Array<Function> | Function): Object {
  let chainData = data
  if (data.constructor.name === 'ObservableArray') {
    chainData = data.slice()
  } else if (data.constructor.name === 'ObservableMap') {
    chainData = data.toJS()
  }
  return flow(...concat([], funcs))(chainData)
}

export function schedule(...funcs: Array<Function>): Array<Function> {
  return map(map(funcs, (args) => partial(...args)), autorun)
}

function revertChange(obs: Array<any> & observable, change: UpdateChange & SpliceChange): UpdateChange | SpliceChange {
  if (change.type === 'update') {
    const newChange = {
      type: 'update',
      name: change.name,
      index: change.index,
      oldValue: null
    }

    if (change.index !== undefined) {
      newChange.oldValue = obs[change.index]
      obs[change.index] = change.oldValue
    } else {
      newChange.oldValue = obs.get(change.name)
      obs.set(change.name, change.oldValue)
    }

    return newChange
  }
  const removed = obs.splice(change.index, change.addedCount, ...change.removed)
  return {
    type: 'splice',
    removed,
    index: change.index,
    addedCount: change.removed.length
  }
}

function createData(data: Object, limit: number): Object {
  // Throw an error if the data isn't an array or object
  if (typeof data !== 'object') throw new Error('Tried to create value with invalid type')

  // Create the observable with history
  const obs = Object.defineProperties(observable(Array.isArray(data) ? data : asMap(data)), {
    __past: { value: [], writable: true },
    __future: { value: [], writable: true },
    __trackChanges: { value: true, writable: true }
  })

  // Observe all changes to the observable to create history for undo/redo
  observe(obs, function(change: UpdateChange & SpliceChange) {
    if (obs.__trackChanges) {
      obs.__future = []
      obs.__past.push(change)

      // Start deleting from the past state if it exceeds the configured limit
      if (obs.__past.length > limit) obs.__past.shift()
    } else {
      obs.__trackChanges = true
    }
  })

  return obs
}

function createDataWithoutHistory(data) {
  // Throw an error if the data isn't an array or object
  if (typeof data !== 'object') throw new Error('Tried to create value with invalid type')
  return observable(Array.isArray(data) ? data : asMap(data))
}
