// @flow

import { autorun } from 'mobx'

export function init(source: string, read: Function, write: Function): Object {
  const obj = read(source)
  autorun(() => write(source, obj.toJs()))
  return obj
}
