// @flow

import _ from 'lodash'
import { observable } from 'mobx'

const dbObject = {}
function db(key: string): Array<any> {
  // If the observable array doesn't exist create it
  if (!dbObject[key]) {
    const obs = observable([])
    dbObject[key] = {
      obs, // The observable array
      __data: loWrap(obs.slice(), key) // The underlying array
    }
  }
  return dbObject[key].__data
}

// Wrap a collection such that you can call lodash methods on it implicitly.
// Normally you would need to do something like _.method(collection), but now
// you can just do collection.method().
function loWrap(array: Array<any>, key: string) {
  const lodash = _.runInContext()
  const wrapped = _.chain(array)
  const updateObs = _.partialRight(update, key)

  // Make it so every method called in the chain calls .value() on itself right after.
  // This way it doesn't really behave like a chain, but allows the collection.method() API.
  for (const method of _.functionsIn(wrapped)) {
    wrapped[method] = _.flow(
      wrapped[method],
      unwrap,
      updateObs
    )
  }

  // Expose the observable array
  wrapped.obs = function() {
    return dbObject[key].obs
  }

  // Fix the chain function so it doesn't do .chain().value(), which breaks chaining.
  wrapped.chain = function() {
    // Alter the prototype of lodash ONLY for this chain
    // to update the observable after value() is called
    lodash.prototype.value =
      lodash.flow(
        lodash.prototype.value,
        updateObs
      )

    // Return a chain with an altered value prototype
    return lodash.chain(array)
  }

  // Fix the value function so it doesn't do .value().value().
  wrapped.value = _.prototype.value
  return wrapped
}

// Unwrap the result of a lodash function chain
function unwrap(chain: any): any {
  return !chain ? null : chain.value ? chain.value() : chain
}

// Make it so changes to the underlying array reflect in the observable array
function update(value: any, key: string) {
  const data = dbObject[key].__data.value()
  if (JSON.stringify(dbObject[key].obs.slice()) !== JSON.stringify(data)) {
    dbObject[key].obs.replace(_.cloneDeep(data))
  }
  return value
}

export default db
db.object = dbObject // expose the dbObject
