// @flow

import { forOwn } from 'lodash'
import { map as obsMap } from 'mobx'

function deserialize(objString: string): Object {
  const db = obsMap({})
  const obj = JSON.parse(objString)

  // Read the object, creating data in the db for each key
  forOwn(obj, (value, key) => db.set(key, value))
  return db
}

function read(source: string) {
  const data = localStorage.getItem(source)
  if (data) {
    return deserialize(data)
  }
  localStorage.setItem(source, '{}')
  return obsMap({})
}

function write(dest: string, obj: Object) {
  return localStorage.setItem(dest, JSON.stringify(obj))
}

export default { read, write }
