import test from 'ava'
import mobxstore from '../src'
import storage from '../src/localstorage'

global.localStorage = {
  store: { db: '{"a": [1, 2, 3]}' },
  setItem: (key, value) => localStorage.store[key] = value,
  getItem: (key) => localStorage.store[key]
}

test('Store reads from and writes to local storage', function(t) {
  const store = mobxstore({
    ...storage.read('db'),
    b: []
  })
  store.schedule([storage.write, 'db', store.object])
  t.deepEqual(store('a').slice(), [1, 2, 3])
  store('b').replace([4, 5, 6])
  t.deepEqual(JSON.parse(global.localStorage.store.db).b, [4, 5, 6])
  t.deepEqual(storage.read('x'), {})
})
