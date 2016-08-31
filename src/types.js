// @flow

export type Change = {
  name?: string,
  index: number,
  oldValue?: any,
  object: Object,
  addedCount?: number,
  removed?: Array<any>,
  spyReportEnd?: boolean,
  spyReportStart?: boolean,
  type: 'splice' | 'update'
}
