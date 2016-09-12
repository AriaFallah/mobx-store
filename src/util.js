// @flow

import type { Change } from './types'

// Take a change event and revert it
export function revertChange(change: Change): Change | null {
  const obs = change.object
  if (change.type === 'splice') {
    const removed = obs.splice(change.index, change.addedCount, ...change.removed)
    return {
      removed,
      type: 'splice',
      index: change.index,
      object: change.object,
      addedCount: change.removed.length
    }
  }

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

  if (change.type === 'add') {
    if (obs.constructor.name === 'ObservableMap') {
      change.object.delete(change.name)
    } else {
      delete change.object[change.name]
    }

    return {
      type: 'delete',
      name: change.name,
      object: change.object,
      oldValue: change.newValue
    }
  }

  if (obs.constructor.name === 'ObservableMap') {
    change.object.set(change.name, change.oldValue)
  } else {
    change.object[change.name] = change.oldValue
  }

  return {
    type: 'add',
    name: change.name,
    object: change.object,
    newValue: change.oldValue
  }
}
