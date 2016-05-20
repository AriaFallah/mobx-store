import test from 'ava'
import fs from 'fs'
import mobxstore from '../src'
import local from '../src/localstorage'
import file from '../src/file'

global.localStorage = {
  store: { db: '{"a": [1, 2, 3]}' },
  setItem: (key, value) => localStorage.store[key] = value,
  getItem: (key) => localStorage.store[key]
}

test('Store reads from and writes to local storage', function(t) {
  const store = mobxstore({ ...local.read('db'), b: {} })
  store.schedule([local.write, 'db', store.object])
  t.deepEqual(store('a').slice(), [1, 2, 3])
  store('b').set('hello', 1)
  t.deepEqual(JSON.parse(global.localStorage.store.db).b, { hello: 1 })
  t.deepEqual(local.read('x'), {})
})

test('Store handles bad file inputs', function(t) {
  t.deepEqual(file.read('./data/x.json'), {})
  t.deepEqual(file.read('./data/empty.txt'), {})
})

test('Store reads from and writes to a file', function(t) {
  fs.writeFileSync('./data/data.json', '{ "hello": { "world": 1 } }')
  const store = mobxstore({ ...file.read('./data/data.json'), b: [] })
  store.schedule([file.write, './data/data.json', store.object])
  t.deepEqual(store('hello').get('world'), 1)
  store('hello').set('world', 2)
  store('b').replace([4, 5, 6])
  t.deepEqual(JSON.parse(fs.readFileSync('./data/data.json')), {
    hello: {
      world: 2
    },
    b: [4, 5, 6]
  })
  t.deepEqual(file.read('x'), {})
})
