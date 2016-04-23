import test from 'ava'
import mobxstore from '../src'
import storage from '../src/localstorage'
import { autorun } from 'mobx'
import { map, find, filter, toUpper, sortBy, take, forEach } from 'lodash/fp'

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

test('Store works when calling a single method', function(t) {
  let i = 0
  const store = mobxstore()

  store('test').replace([1, 2, 3])
  autorun(() => i += noop(store('test')[0]))
  store('test').replace([4, 5, 6])
  t.is(i, 2)
})

test('Store should not report a change when nothing changes', function(t) {
  let i = 0
  const store = mobxstore()

  store('test').replace([{ a: 1 }, { b: 2 }, { c: 3 }])
  autorun(() => i += noop(store('test')[0]))
  store('test', find({ a: 1 }))
  t.not(i, 2)
})

test('Store works when chaining', function(t) {
  let i = 0
  const store = mobxstore()

  store('test').replace([{ a: 1 }, { b: 2 }, { c: 3 }])
  autorun(() => i += noop(store('test')[0].a))
  store('test', find({ a: 1 })).a = 'wow'
  t.is(i, 2)
})

test('Store time travel works', function(t) {
  const store = mobxstore()

  store('time').replace([1, 2, 3])
  store('time').replace([4, 2, 3])
  store('travel').replace([1, 3, 3])
  store('travel').replace([1, 2, 3])
  t.is(JSON.stringify(store.states.slice()), JSON.stringify([
    {},
    { time: [] },
    { time: [1, 2, 3] },
    { time: [4, 2, 3] },
    { time: [4, 2, 3], travel: [] },
    { time: [4, 2, 3], travel: [1, 3, 3] },
    { time: [4, 2, 3], travel: [1, 2, 3] }
  ]))
})

test('Examples in store work', function(t) {
  const store = mobxstore()

  store('numbers')
  store('numbers').replace([1, 2, 3])
  t.deepEqual(store('numbers', filter((v) => v > 1)), [2, 3])

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

  store('users').replace(users)
  const top3 = store('users', [sortBy('id'), take(3)])
  t.deepEqual(store.chain(top3, map('name')), ['a', 'b', 'c'])
  t.deepEqual(store.chain(top3, map((v) => toUpper(v.name))), ['A', 'B', 'C'])
  t.deepEqual(store.chain(top3, map('name')), ['a', 'b', 'c'])
  store.chain(top3, forEach((v) => v.name = toUpper(v.name)))
  t.deepEqual(store.chain(top3, map('name')), ['A', 'B', 'C'])
})

function noop() {
  return 1
}
