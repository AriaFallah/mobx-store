// @flow

import { concat, flow, isObject, map, mapValues, partial, partialRight, values } from 'lodash'
import { action, autorun, asMap, observable, toJS, spy } from 'mobx'
import type { StoreConfig, SpliceChange, UpdateChange } from './types'

export default function(intitialState: Object = {}, userConfig?: StoreConfig = {}): Function {
  const config = {
    historyLimit: Infinity,
    noHistory: false,
    ...userConfig
  }
  const create = config.noHistory
    ? createDataWithoutHistory
    : partialRight(createData, config.historyLimit)
  const dbObject = observable(asMap(mapValues(intitialState, (value) => create(value))))

  // Store API
  db.canRedo = (key: string): boolean => dbObject.get(key).__future.length > 0
  db.canUndo = (key: string): boolean => dbObject.get(key).__past.length > 0
  db.contents = (): Object => toJS(dbObject)
  db.set = action((key: string, value: Object): void => dbObject.set(key, create(value)))
  db.redo = action(redo)
  db.undo = action(undo)
  db.chain = chain
  db.object = dbObject
  db.schedule = schedule

  // Query the DB, allowing the user to chain functions to query the store
  function db(key: string, funcs?: Array<Function> | Function): Object {
    if (!dbObject.get(key)) throw new Error('Tried to retrieve undefined key')
    if (funcs) {
      return chain(dbObject.get(key), funcs)
    }
    return dbObject.get(key)
  }

  // Redo any undone changes to the given store
  function redo(key: string): void {
    const obs = dbObject.get(key)
    if (!db.canRedo(key)) {
      throw new Error('You cannot call redo without having called undo first')
    }

    // Redo shouldn't trigger a push to history
    obs.__trackChanges = false
    obs.__past.push(revertChange(obs.__future.pop()))
  }

  // Undo any changes the user has made to the current store
  function undo(key: string): void {
    const obs = dbObject.get(key)
    if (!db.canUndo(key)) {
      throw new Error('You cannot call undo if you have not made any changes')
    }

    // Undo shouldn't trigger a push to history
    obs.__trackChanges = false
    obs.__future.push(revertChange(obs.__past.pop()))
  }

  // Return the database object
  return db
}

// Chain multiple lodash/fp functions together to allow declarative querying
export function chain(data: Object, funcs: Array<Function> | Function): Object {
  let chainData = data
  if (data.constructor.name === 'ObservableArray') {
    chainData = data.slice()
  } else if (data.constructor.name === 'ObservableMap') {
    chainData = data.toJS()
  }
  return flow(...concat([], funcs))(chainData)
}

// Automatically run functions with given args when store mutates
export function schedule(...funcs: Array<Function>): Array<Function> {
  return map(map(funcs, (args) => partial(...args)), autorun)
}

// Take a change event and revert it
function revertChange(change: UpdateChange & SpliceChange): UpdateChange | SpliceChange {
  const obs = change.object
  if (change.type === 'update') {
    const newChange = {
      object: change.object,
      type: 'update',
      name: change.name,
      index: change.index,
      oldValue: null
    }

    if (change.index !== undefined) {
      // Array
      newChange.oldValue = obs[change.index]
      obs[change.index] = change.oldValue
    } else if (obs.constructor.name === 'ObservableMap') {
      // MobX Map
      newChange.oldValue = obs.get(change.name)
      obs.set(change.name, change.oldValue)
    } else {
      // MobX Object
      newChange.oldValue = obs[change.name]
      obs[change.name] = change.oldValue
    }

    return newChange
  }
  const removed = obs.splice(change.index, change.addedCount, ...change.removed)
  return {
    object: change.object,
    type: 'splice',
    removed,
    index: change.index,
    addedCount: change.removed.length
  }
}

// Create a store entry such that the it has history that can be undo/redo
function createData(data: Object, limit: number): Object {
  // Throw an error if the data isn't an array or object
  if (typeof data !== 'object') throw new Error('Top level elements of the store need to be arrays or objects')

  // Create the observable with history
  const obs = observable(Array.isArray(data) ? data : asMap(data))
  return Object.defineProperties(obs, {
    __past: { value: [], writable: true },
    __future: { value: [], writable: true },
    __trackChanges: { value: true, writable: true },
    __parent: { value: obs },
    __limit: { value: limit }
  })
}

// Create a store entry
function createDataWithoutHistory(data) {
  // Throw an error if the data isn't an array or object
  if (typeof data !== 'object') throw new Error('Tried to create value with invalid type')
  return observable(Array.isArray(data) ? data : asMap(data))
}

// Spy on the changes
spy(function(change) {
  if (!change.object || !change.object.__parent) return

  // Add the event to the history
  const obs = change.object.__parent
  if (obs.__trackChanges) {
    obs.__future = []
    obs.__past.push(change)
    if (obs.__past.length > obs.__limit) obs.__past.shift()
  } else {
    obs.__trackChanges = true
  }

  // If there was data added, tag all the new data with the parent
  switch (change.type) {
  case 'add':
    connectParent(change.newValue, obs)
    break
  case 'splice':
    connectParent(change.added, obs)
    break
  default: break
  }
})

function connectParent(obj: Object, parent: Object) {
  if (!isObject(obj)) return
  if (obj.slice) {
    for (const elem of obj) connectParent(elem, parent)
  } else {
    for (const value of values(obj)) connectParent(value, parent)
  }
  Object.defineProperty(obj, '__parent', { value: parent })
}
