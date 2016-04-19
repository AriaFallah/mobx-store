// @flow

import _ from 'lodash'
import { observable } from 'mobx'
import memoize from 'sb-memoize'

const dbObject = {}
function db(key: string): Array<any> {
  // If the observable array doesn't exist create it
  if (!dbObject[key]) {
    dbObject[key] = {
      data: observable([]), // The actual data
      __chksum: JSON.stringify([]) // Used to diff the array
    }
  }
  return loWrap(dbObject[key].data.$mobx.values, key)
}

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
    return lodash.chain(dbObject[key].data.$mobx.values)
  }

  // Don't make .value() jump through the hoops above. Just return the value.
  wrapped.value = function() {
    return dbObject[key].data
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
  const chksum = JSON.stringify(dbObject[key].data)
  if (chksum !== dbObject[key].__chksum) {
    dbObject[key].__chksum = chksum
    dbObject[key].data.$mobx.atom.reportChanged()
  } else {
    dbObject[key].data.$mobx.atom.reportObserved()
  }
  return value
}

// Memoize the db function and expose the object
const memoized = memoize(db)
memoized.object = dbObject

export default memoized
