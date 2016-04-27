// @flow

export type Change = {
  name?: number,
  type: string,
  object: Object,
  index?: number,
  addedCount?: number,
  removed?: Array<any>
}

export type StoreConfig = {
  historyLimit?: number
}
