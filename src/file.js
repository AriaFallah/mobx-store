// @flow

import fs from 'fs'

function read(source: string): Object {
  try {
    return JSON.parse(fs.readFileSync(source, 'utf-8').trim() || '{}')
  } catch (err) {
    return {}
  }
}

function write(dest: string, store: Object): void {
  fs.writeFileSync(dest, JSON.stringify(store.contents()))
}

export default { read, write }
