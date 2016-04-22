import test from 'ava'
import store from '../lib'
import { autorun } from 'mobx'

global.localStorage = {
  store: [],
  setItem: (key, value) => localStorage.store[key] = value,
  getItem: (key) => localStorage.store[key]
}

const db = store()

test('It works when calling a single method', (t) => {
  let i = 0
  db('b').assign([1, 2, 3])
  autorun(() => i += noop(db('b').value()[0]))
  db('b').assign([5, 2, 3])
  t.is(i, 2)
})

test('It should not report a change when nothing changes', (t) => {
  let i = 0
  db('c').assign([1, 2, 3])
  autorun(() => i += noop(db('c').value()[0]))
  db('c').find((x) => x === 1)
  t.not(i, 2)
})

test('It works when chaining', (t) => {
  let i = 0
  db('d').assign([{ a: 1 }, { a: 2 }, { a: 3 }])
  autorun(() => i += noop(db('d').value()[0]))
  db('d').chain().find({ a: 1 }).assign({ a: 'wow' }).value()
  t.is(i, 2)
})

function noop() {
  return 1
}
