import test from 'ava'
import store, { mutate } from '../src'
import storage from '../src/localstorage'
import { autorun } from 'mobx'
import { map, find, filter, toUpper, sortBy, take, forEach } from 'lodash/fp'

global.localStorage = {
  store: {
    db: '{"a":{"obs":[1,2,3],"__data":[1,2,3]}}'
  },
  setItem: (key, value) => localStorage.store[key] = value,
  getItem: (key) => localStorage.store[key]
}

const db = store()
const local = store('db', { storage })

test('Local storage works', function(t) {
  storage.read('x')
  t.deepEqual(JSON.parse(global.localStorage.store.x), {})
  storage.write('x', { hello: 'world' })
  t.deepEqual(JSON.parse(global.localStorage.store.x), { hello: 'world' })
})

test('Store reads from and writes to local storage', function(t) {
  t.deepEqual(local('a'), [1, 2, 3])
  local('a', mutate([4, 5, 6]))
  t.deepEqual(JSON.parse(global.localStorage.store.db).a.__data, [4, 5, 6])
})

test('Store works when calling a single method', function(t) {
  let i = 0
  t.deepEqual(db('a', mutate([1, 2, 3])), [1, 2, 3])
  autorun(() => i += noop(db('a')[0]))
  t.deepEqual(db('a', mutate([4, 5, 6])), [4, 5, 6])
  t.is(i, 2)
})

test('Store should not report a change when nothing changes', function(t) {
  let i = 0
  t.deepEqual(db('b', mutate([{ a: 1 }, { b: 2 }, { c: 3 }])), [{ a: 1 }, { b: 2 }, { c: 3 }])
  autorun(() => i += noop(db('b')[0]))
  t.deepEqual(db('b', find({ a: 1 })), { a: 1 })
  t.not(i, 2)
})

test('Store works when chaining', function(t) {
  let i = 0
  t.deepEqual(db('c', mutate([{ a: 1 }, { b: 2 }, { c: 3 }])), [{ a: 1 }, { b: 2 }, { c: 3 }])
  autorun(() => i += noop(db('c')[0]))
  db('c', [find({ a: 1 }), mutate({ a: 'wow' })])
  t.deepEqual(db('c')[0], { a: 'wow' })
  t.is(i, 2)
})

test('Store time travel works', function(t) {
  const isolated = store()
  isolated('time', mutate([1, 2, 3]))
  isolated('time', mutate([4, 2, 3]))
  isolated('space', mutate([1, 3, 3]))
  isolated('space', mutate([1, 2, 3]))
  t.deepEqual(isolated.states, [
    {},
    { time: [] },
    { time: [1, 2, 3] },
    { time: [4, 2, 3] },
    { time: [4, 2, 3], space: [] },
    { time: [4, 2, 3], space: [1, 3, 3] },
    { time: [4, 2, 3], space: [1, 2, 3] }
  ])
})

test('Examples in docs work', function(t) {
  const docs = store()
  t.deepEqual(docs('numbers'), [])
  docs('numbers', mutate([1, 2, 3]))
  t.deepEqual(docs('numbers', filter((v) => v > 1)), [2, 3])

  const users = [{
    id: 1,
    name: 'a'
  }, {
    id: 2,
    name: 'b'
  }, {
    id: 3,
    name: 'c'
  }, {
    id: 4,
    name: 'd'
  }, {
    id: 5,
    name: 'e'
  }]

  docs('users', mutate(users))
  t.deepEqual(docs('users', [sortBy('id'), take(3), map('name')]), ['a', 'b', 'c'])
  t.deepEqual(docs('users', [sortBy('id'), take(3), map((v) => toUpper(v.name))]), ['A', 'B', 'C'])
  t.deepEqual(docs('users', [sortBy('id'), take(3), map('name')]), ['a', 'b', 'c'])
  docs('users', [sortBy('id'), take(3), forEach((v) => v.name = toUpper(v.name))])
  t.deepEqual(docs('users', [sortBy('id'), take(3), map('name')]), ['A', 'B', 'C'])
})

function noop() {
  return 1
}
