// @flow

type SpliceChange = {
  index: number,
  object: Object,
  addedCount: number,
  removed: Array<any>,
  type: 'splice'
}

type UpdateChange = {
  name: string,
  index: number,
  oldValue: any,
  object: Object,
  type: 'update'
}

type AddChange = {
  name: string,
  object: Object,
  newValue: any,
  type: 'add'
}

type DeleteChange = {
  name: string,
  oldValue: any,
  object: Object,
  type: 'delete'
}

export type Change =
  SpliceChange
  | UpdateChange
  | DeleteChange
  | AddChange
