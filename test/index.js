import test from 'ava'
import db from '../lib'
import { autorun } from 'mobx'

function noop() {
  return 1
}

test('It works modifying the object manually', (t) => {
  let i = 0
  db('x').assign([1, 2, 3])
  autorun(() => i += noop(db('x').value()[0]))
  db.object.x[0] = 2
  t.is(i, 2)
})

test('It works when calling a single method', (t) => {
  let i = 0
  db('x').assign([1, 2, 3])
  autorun(() => i += noop(db('x').value()[0]))
  db('x').assign([5, 2, 3])
  t.is(i, 2)
})

test('It should not report a change when nothing changes', (t) => {
  let i = 0
  db('x').assign([1, 2, 3])
  autorun(() => i += noop(db('x').value()[0]))
  db('x').find((x) => x === 1)
  t.not(i, 2)
})

test('It works when chaining', (t) => {
  let i = 0
  db('x').assign([1, 2, 3])
  autorun(() => i += noop(db('x').value()[0]))
  db('x').chain().find((x) => x === 1).assign(4).value()
  t.is(i, 2)
})
