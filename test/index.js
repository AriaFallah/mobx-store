import test from 'ava'
import store from '../src'
import storage from '../src/localstorage'
import { autorun } from 'mobx'

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
  t.deepEqual(local('a').value(), [1, 2, 3])
  local('a').assign([4, 5, 6])
  t.deepEqual(JSON.parse(global.localStorage.store.db).a.__data, [4, 5, 6])
})

test('Store works when calling a single method', function(t) {
  let i = 0
  db('a').assign([1, 2, 3])
  autorun(() => i += noop(db('a').value()[0]))
  db('a').assign([5, 2, 3])
  t.is(i, 2)
})

test('Store should not report a change when nothing changes', function(t) {
  let i = 0
  db('b').assign([1, 2, 3])
  autorun(() => i += noop(db('b').value()[0]))
  db('b').find((x) => x === 1)
  t.not(i, 2)
})

test('Store works when chaining', function(t) {
  let i = 0
  db('c').assign([{ a: 1 }, { a: 2 }, { a: 3 }])
  autorun(() => i += noop(db('c').value()[0]))
  db('c').chain().find({ a: 1 }).assign({ a: 'wow' }).value()
  t.is(i, 2)
})

test('Store time travel works', function(t) {
  const isolated = store()
  isolated('time').assign([1, 2, 3])
  isolated('time').assign([4, 2, 3])
  isolated('space').assign([1, 3, 3])
  isolated('space').assign([1, 2, 3])
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

function noop() {
  return 1
}
