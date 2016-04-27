// @flow

export type UpdateChange = {
  type: string,
  name: number,
  oldValue: any
}

export type SpliceChange = {
  type: string,
  index: number,
  addedCount: number,
  removed: Array<any>,
}

export type StoreConfig = {
  historyLimit?: number
}
