// @flow

import { spy, toJS } from 'mobx'
import { concat, flow, revertChange } from './util'
import type { Change } from './types'

// Block off change monitoring while undoing and redoing
let isUndoing = false
let isRedoing = false

// Actions is an object that holds a stack of batched changes for each action
const actions = {}

// Undo an action
export function undo(actionName: string): void {
  isUndoing = true
  actions[actionName].future.unshift(actions[actionName].past.pop().map(revertChange).reverse())
  isUndoing = false
}

// Redo an action
export function redo(actionName: string): void {
  isRedoing = true
  actions[actionName].past.unshift(actions[actionName].future.pop().map(revertChange).reverse())
  isRedoing = false
}

// Initialize change spying for undo/redo
export function watchHistory(): Function {
  let depth = 0
  let currentDepth = 0
  let currentAction = ''

  return spy(function(change: Change) {
    if (isUndoing || isRedoing) return
    if (change.spyReportEnd) depth--
    if (change.spyReportStart) depth++

    if (!currentAction && change.type === 'action') {
      // Save current action
      currentDepth = depth
      currentAction = change.name

      // Initialize action
      if (!actions[currentAction]) actions[currentAction] = { past: [], future: [] }
      actions[currentAction].past.unshift([])
    } else if (currentAction && depth >= currentDepth) {
      // Everything with > depth is part of the current action
      if (change.type) actions[currentAction].past[0].unshift(change)
    } else {
      // Reset
      currentDepth = 0
      currentAction = ''
    }
  })
}

// Chain multiple pure functions together to allow declarative querying
export function chain(data: Object, funcs: Array<Function> | Function): Object {
  return flow(...concat([], funcs))(Array.isArray(data) ? data : toJS(data))
}
