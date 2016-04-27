// @flow

function read(source: string) {
  const data = localStorage.getItem(source)
  if (data) {
    return JSON.parse(data)
  }
  return {}
}

function write(dest: string, store: Object) {
  return localStorage.setItem(dest, JSON.stringify(store.toJs()))
}

export default { read, write }
