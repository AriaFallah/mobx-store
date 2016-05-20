import test from 'ava'
import fs from 'fs'
import mobxstore from '../src'
import local from '../src/localstorage'
import filesync from '../src/filesync'

global.localStorage = {
  store: { db: '{"a": [1, 2, 3]}' },
  setItem: (key, value) => localStorage.store[key] = value,
  getItem: (key) => localStorage.store[key]
}

test('Store reads from and writes to local storage', function(t) {
  const store = mobxstore({ ...local.read('db'), b: [] })
  store.schedule([local.write, 'db', store.object])
  t.deepEqual(store('a').slice(), [1, 2, 3])
  store('b').replace([4, 5, 6])
  t.deepEqual(JSON.parse(global.localStorage.store.db).b, [4, 5, 6])
  t.deepEqual(local.read('x'), {})
})

test('Store reads from and writes to a file', function(t) {
  const store = mobxstore({ ...filesync.read('./data/data.json'), b: [] })
  store.schedule([filesync.write, 'db', store.object])
  t.deepEqual(store('hello').get('world'), 1)
  store('hello').set('world', 2)
  store('b').replace([4, 5, 6])
  t.deepEqual(JSON.parse(fs.readFileSync('./data/data.json')), {
    hello: {
      world: 2
    },
    b: [4, 5, 6]
  })
  t.deepEqual(filesync.read('x'), {})
})
