// @flow

import _ from 'lodash'
import { autorun, asReference } from 'mobx'

export function createData(obj: Object, key: string, value: Array<any> = []) {
  return {
    obs: value, // The observable array
    __data: asReference(loWrap(obj, key, value)) // The underlying array
  }
}

export function init(source: string, read: Function, write: Function): Object {
  const obj = read(source)
  autorun(() => write(source, obj.toJs()))
  return obj
}

// Wrap a collection such that you can call lodash methods on it implicitly.
// Normally you would need to do something like _.method(collection), but now
// you can just do collection.method().
function loWrap(obj: Object, key: string, value: Array<any>) {
  const lodash = _.runInContext()
  const wrapped = _.chain(value)
  const updateObs = _.partial(update, obj, key)

  // Make it so every method called in the chain calls .value() on itself right after.
  // This way it doesn't really behave like a chain, but allows the collection.method() API.
  for (const method of _.functionsIn(wrapped)) {
    wrapped[method] = _.flow(
      wrapped[method],
      unwrap,
      updateObs
    )
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

    // Return a chain with the altered value prototype
    return lodash.chain(value)
  }

  // Fix the value function so it doesn't do .value().value().
  wrapped.value = () => obj.get(key).obs.slice()

  // Save the normal value function for internal usage
  wrapped.__value = _.prototype.value
  return wrapped
}

// Unwrap the result of a lodash function chain
function unwrap(chain: any): any {
  return !chain ? null : chain.value ? chain.value() : chain
}

// Make it so changes to the underlying array reflect in the observable array
function update(obj: Object, key: string, value: any) {
  const data = obj.get(key).__data.__value()
  if (JSON.stringify(obj.get(key).obs.slice()) !== JSON.stringify(data)) {
    obj.get(key).obs.replace(_.cloneDeep(data))
  }
  return value
}
