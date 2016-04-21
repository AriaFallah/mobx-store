export function read(source, deserialize = JSON.parse) {
  const data = localStorage.getItem(source)
  if (data) {
    return deserialize(data)
  }
  localStorage.setItem(source, '{}')
  return {}
}

export function write(dest, obj, serialize = JSON.stringify) {
  return localStorage.setItem(dest, serialize(obj))
}
