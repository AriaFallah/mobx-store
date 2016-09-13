// @flow

import type { Change } from './types'

import flow from 'lodash.flow'
import concat from 'lodash.concat'
import { revertChange } from './util'
import { action, spy, toJS } from 'mobx'

// Block off change monitoring while undoing and redoing
let isUndoing = false
let isRedoing = false

// Actions is an object that holds a stack of batched changes for each action
const actions = {}

// Chain multiple pure functions together to allow declarative querying
export function chain(data: Object, funcs: Array<Function> | Function): Object {
  return flow(...concat([], funcs))(Array.isArray(data) ? data : toJS(data))
}

// Undo an action
export const undo = action('undo', function undo(actionName: string): void {
  if (actions[actionName].past.length === 0) return
  isUndoing = true
  actions[actionName].future.push(
    actions[actionName].past
      .pop()
      .map(revertChange)
      .reverse()
  )
  isUndoing = false
})

// Redo an action
export const redo = action('redo', function redo(actionName: string): void {
  if (actions[actionName].future.length === 0) return
  isRedoing = true
  actions[actionName].past.push(
    actions[actionName].future
      .pop()
      .map(revertChange)
      .reverse()
  )
  isRedoing = false
})

// Initialize change spying for undo/redo
export function watchHistory(): Function {
  let depth = 0
  let currentDepth = 0
  let currentAction = ''

  return spy(function(change: Change) {
    if (isUndoing || isRedoing) return
    if (change.spyReportEnd) depth--
    if (change.spyReportStart) depth++

    // Ignore nested actions
    if (!currentAction && change.type === 'action') {
      // Save current action
      currentDepth = depth
      currentAction = change.name

      // Add it to the past
      if (!actions[currentAction]) actions[currentAction] = { past: [], future: [] }
      actions[currentAction].past.push([])
    } else if (currentAction && depth >= currentDepth) {
      // Everything with > depth is part of the current action
      switch (change.type) {
        case 'add':
        case 'update':
        case 'splice':
        case 'delete':
          const past = actions[currentAction].past
          past[past.length - 1].unshift(change)
          actions[currentAction].future = []
          break
        default: break
      }
    } else {
      // Reset
      currentDepth = 0
      currentAction = ''
    }
  })
}
