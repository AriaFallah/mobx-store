// @flow

import { autorun } from 'mobx'

export function init(source: string, read: Function, write: Function): Object {
  const obj = read(source)
  autorun(() => write(source, obj.toJs()))
  return obj
}

export function addKey(data: any, key: string): Object {
  return Object.defineProperty(data, '__key', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: key
  })
}
