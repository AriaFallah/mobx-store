// @flow

export type UpdateChange = {
  object: Object,
  type: 'update',
  index: number,
  name: string,
  oldValue: any
}

export type SpliceChange = {
  object: Object,
  type: 'splice',
  index: number,
  addedCount: number,
  removed: Array<any>
}

export type StoreConfig = {
  history?: boolean,
  historyLimit?: number
}
