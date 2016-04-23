// @flow

import { cloneDeep } from 'lodash'
import { autorun, asReference } from 'mobx'

export function createData(obj: Object, key: string, value: any = []) {
  return {
    obs: value, // The observable array
    __data: asReference(addKey(value, key)) // The underlying array
  }
}

export function init(source: string, read: Function, write: Function): Object {
  const obj = read(source)
  autorun(() => write(source, obj.toJs()))
  return obj
}

// Make it so changes to the underlying array reflect in the observable array
export function update(obj: Object, key: string, value: any) {
  const data = obj.get(key).__data
  if (JSON.stringify(obj.get(key).obs.slice()) !== JSON.stringify(data)) {
    obj.get(key).obs.replace(cloneDeep(data))
  }
  return value
}

export function addKey(data: any, key: string): Object {
  return Object.defineProperty(data, '__key', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: key
  })
}
