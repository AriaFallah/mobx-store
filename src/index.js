// @flow

import _ from 'lodash'
import { observable } from 'mobx'

export default function db(key: string): Array<any> {
  // If the observable array doesn't exist create it
  if (!db.object[key]) {
    db.object[key] = {
      data: observable([]), // The actual data
      __chksum: JSON.stringify([]) // Used to diff the array
    }
  }
  return loWrap(db.object[key].data.$mobx.values, key)
}
db.object = {}

// Wrap the collection such that you can call lodash methods on it implicitly.
// Normally you would need to do something like _.method(collection), but now
// you can just do collection.method().
function loWrap(array: Array<any>, key: string) {
  const wrapped = _.chain(array)

  // Make it so every method called in the chain calls value() on itself right after.
  // This way it doesn't really behave like a chain, but allows the collection.method() usage
  for (const method of _.functionsIn(wrapped)) {
    wrapped[method] = _.flow(wrapped[method], unwrap, _.partialRight(reportChange, key))
  }

  // We need to fix chain so it'll actually chain.
  // We just broke it above by calling .value() after it's called.
  wrapped.chain = function() {
    // Alter the prototype of lodash ONLY for this chain
    // such that a change is reported when .value() is called at the end of the chain
    const lodash = _.runInContext()
    lodash.prototype.value = lodash.flow(lodash.prototype.value, lodash.partialRight(reportChange, key))
    return lodash.chain(db.object[key].data.$mobx.values)
  }

  // Don't make .value() jump through the hoops above. Just return the value.
  wrapped.value = function() {
    return db.object[key].data
  }
  
  return wrapped
}

// Unwrap the result of a lodash function call if it is wrapped
function unwrap(value: any): any {
  if (!value) return null
  return _.isFunction(value.value) ? value.value() : value
}

// Report a change if the collection has changed
function reportChange(value: any, key: string) {
  const chksum = JSON.stringify(db.object[key].data)
  if (chksum !== db.object[key].__chksum) {
    db.object[key].__chksum = chksum
    db.object[key].data.$mobx.atom.reportChanged()
  }
  return value
}
