// @flow

import _ from 'lodash'
import { observable } from 'mobx'

const lodash = _.runInContext()

export default function db(key: string): Array<any> {
  if (!db.object[key]) {
    db.object[key] = observable([])
    db.object[key].__chksum = JSON.stringify([])
  }
  const wrapped = loWrap(db.object[key].$mobx.values, key)
  wrapped.chain = () => {
    lodash.prototype.value = lodash.flow(lodash.prototype.value, lodash.partialRight(reportChange, key))
    const chain = lodash.chain(db.object[key].$mobx.values)
    return chain
  }
  wrapped.value = () => db.object[key]
  return wrapped
}
db._ = _
db.object = {}

function loWrap(array: Array<any>, key: string) {
  const chain = _.chain(array)
  for (const method of _.functionsIn(chain)) {
    chain[method] = _.flow(chain[method], unwrap, _.partialRight(reportChange, key))
  }
  return chain
}

function unwrap(value: any): any {
  if (!value) return null
  return _.isFunction(value.value) ? value.value() : value
}

function reportChange(value: any, key: string) {
  const chksum = JSON.stringify(value)
  if (chksum !== db.object[key].__chksum) {
    db.object[key].__chksum = chksum
    db.object[key].$mobx.atom.reportChanged()
  }
  return value
}
