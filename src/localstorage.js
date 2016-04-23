// @flow

function read(source: string) {
  const data = localStorage.getItem(source)
  if (data) {
    return JSON.parse(data)
  }
  localStorage.setItem(source, '{}')
  return {}
}

function write(dest: string, obj: Object) {
  return localStorage.setItem(dest, JSON.stringify(obj.toJs ? obj.toJs() : obj))
}

export default { read, write }
