import { Change } from './types'

// Lodash utils
export flow from 'lodash.flow'
export concat from 'lodash.concat'

// Take a change event and revert it
export function revertChange(change: Change): Change {
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
