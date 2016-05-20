// @flow

export type UpdateChange = {
  type: 'update',
  index: number,
  name: string,
  oldValue: any
}

export type SpliceChange = {
  type: 'splice',
  index: number,
  addedCount: number,
  removed: Array<any>
}

export type StoreConfig = {
  history?: boolean,
  historyLimit?: number
}
