// @flow

import { concat, flow, map, mapValues, partial, partialRight } from 'lodash'
import { autorun, map as mapObs, observable, observe } from 'mobx'
import type { StoreConfig, SpliceChange, UpdateChange } from './types'

export default function(intitialState: Object = {}, config: StoreConfig = { historyLimit: Infinity }): Function {
  const create = partialRight(createData, config.historyLimit)
  const dbObject = mapObs(mapValues(intitialState, create))

  function db(key: string, funcs?: Array<Function> | Function): Object {
    if (!dbObject.get(key)) dbObject.set(key, create([]))
    if (funcs) {
      return chain(dbObject.get(key), funcs)
    }
    return dbObject.get(key)
  }
  db.chain = chain
  db.object = dbObject
  db.redo = redo
  db.schedule = schedule
  db.undo = undo

  function undo(key: string) {
    const obs = dbObject.get(key)
    if (obs === undefined) {
      throw new Error('You cannot call undo on a nonexistent collection')
    } else if (obs.__past.length === 0) {
      throw new Error('You cannot call undo if you have not made any changes')
    }
    obs.__shouldUpdate = false
    obs.__future.push(revertChange(obs, obs.__past.pop()))
  }

  function redo(key: string) {
    const obs = dbObject.get(key)
    if (obs === undefined) {
      throw new Error('You cannot call redo on a nonexistent collection')
    } else if (obs.__future.length === 0) {
      throw new Error('You cannot call redo without having called undo first')
    }
    obs.__shouldUpdate = false
    obs.__past.push(revertChange(obs, obs.__future.pop()))
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

function revertChange(obs: Array<any>, change: UpdateChange & SpliceChange): UpdateChange | SpliceChange {
  if (change.type === 'update') {
    const old = obs[change.index]
    obs[change.index] = change.oldValue
    return {
      type: 'update',
      oldValue: old,
      index: change.index
    }
  }
  const removed = obs.splice(change.index, change.addedCount, ...change.removed)
  return {
    type: 'splice',
    removed,
    index: change.index,
    addedCount: change.addedCount
  }
}

function createData(data: any, limit: number) {
  const obs = Object.defineProperties(observable(data), {
    __past: { value: [], writable: true },
    __future: { value: [], writable: true },
    __shouldUpdate: { value: true, writable: true }
  })
  observe(obs, function(change: UpdateChange & SpliceChange) {
    if (obs.__shouldUpdate) {
      obs.__future = []

      // Push everything except change.object since we don't need that
      obs.__past.push({
        type: change.type,
        index: change.index,
        addedCount: change.addedCount,
        removed: change.removed,
        oldValue: change.oldValue
      })
      if (obs.__past.length > limit) obs.__past.shift()
    } else {
      obs.__shouldUpdate = true
    }
  })
  return obs
}
