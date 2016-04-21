// @flow

import _ from 'lodash'
import { observable, autorun } from 'mobx'

function createDb(source: string, options: Object = {}): Function {
  let dbObject = {}
  const storage = options && options.storage

  if (storage) {
    db.read = storage.read
    db.write = storage.write
    dbObject = init(db.read, db.write)
  }

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

  function init(read: Function, write: Function): Object {
    // Read the object, iterating through to make the arrays at obs observable
    const obj = _.forOwn(
      read(source),
      (value) => _.update(value, 'obs', (v) => v ? observable(v) : v)
    )

    // When the object is modified write it to the source
    autorun(() => write(source, obj))
    return obj
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
    wrapped.value = () => dbObject[key].obs.slice()

    // Save the normal value function for internal usage
    wrapped.__value = _.prototype.value
    return wrapped
  }

  // Unwrap the result of a lodash function chain
  function unwrap(chain: any): any {
    return !chain ? null : chain.value ? chain.value() : chain
  }

  // Make it so changes to the underlying array reflect in the observable array
  function update(value: any, key: string) {
    const data = dbObject[key].__data.__value()
    if (JSON.stringify(dbObject[key].obs.slice()) !== JSON.stringify(data)) {
      dbObject[key].obs.replace(_.cloneDeep(data))
    }
    return value
  }

  // Return the database object
  return db
}

export default createDb
