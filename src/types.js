// @flow

export type UpdateChange = {
  type: 'update',
  index: number,
  oldValue: any
}

export type SpliceChange = {
  type: 'splice',
  index: number,
  addedCount: number,
  removed: Array<any>
}

export type StoreConfig = {
  historyLimit?: number
}
