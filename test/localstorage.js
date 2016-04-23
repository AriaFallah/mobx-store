import test from 'ava'
import mobxstore from '../src'
import storage from '../src/localstorage'

global.localStorage = {
  store: { db: '{"a": [1, 2, 3]}' },
  setItem: (key, value) => localStorage.store[key] = value,
  getItem: (key) => localStorage.store[key]
}

test('Local storage works', function(t) {
  storage.read('x')
  t.deepEqual(JSON.parse(global.localStorage.store.x), {})
  storage.write('x', { hello: 'world' })
  t.deepEqual(JSON.parse(global.localStorage.store.x), { hello: 'world' })
})

test('Store reads from and writes to local storage', function(t) {
  const store = mobxstore('db', { storage })

  t.deepEqual(store('a').slice(), [1, 2, 3])
  store('a').replace([4, 5, 6])
  t.deepEqual(JSON.parse(global.localStorage.store.db).a, [4, 5, 6])
})
