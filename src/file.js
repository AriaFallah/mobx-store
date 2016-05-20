// @flow

import fs from 'fs'
import { toJSON } from 'mobx'

function read(source: string): Object {
  try {
    return JSON.parse(fs.readFileSync(source, 'utf-8').trim() || '{}')
  } catch (err) {
    return {}
  }
}

function write(dest: string, obj: Object): void {
  fs.writeFileSync(dest, JSON.stringify(toJSON(obj)))
}

export default { read, write }
