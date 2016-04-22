// @flow

import _ from 'lodash'
import { map } from 'mobx'
import { createData } from './util'

function deserialize(objString: string): Object {
  const db = map({})
  const obj = JSON.parse(objString)

  // Read the object, creating data in the db for each key
  _.forOwn(
    obj,
    (value, key) => db.set(key, createData(db, key, value.__data))
  )

  return map
}

function read(source: string) {
  const data = localStorage.getItem(source)
  if (data) {
    return deserialize(data)
  }
  localStorage.setItem(source, '{}')
  return {}
}

function write(dest: string, obj: Object) {
  return localStorage.setItem(dest, JSON.stringify(obj))
}

export default { read, write }
