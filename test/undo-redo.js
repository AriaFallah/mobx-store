import test from 'ava'
import mobxstore from '../src'
import { autorun } from 'mobx'
import { partial } from 'lodash'
import { pull } from 'lodash/fp'

test('Store undo/redo throws at proper times', function(t) {
  const store = mobxstore()
  t.throws(partial(store.undo, 'test'))
  t.throws(partial(store.redo, 'test'))
  store('test')
  t.throws(partial(store.undo, 'test'))
  t.throws(partial(store.redo, 'test'))
  store('test').replace([1, 2, 3])
  t.throws(partial(store.redo, 'test'))
})

test('Store undo/redo triggers autorun', function(t) {
  let i = 0
  const store = mobxstore()
  store('test').replace([1, 2, 3])
  autorun(() => {
    i++
    store('test').slice()
  })
  store.undo('test')
  store.redo('test')
  t.is(i, 3)
})

test('Store undo/redo works with direct mutation', function(t) {
  const store = mobxstore()
  store('test').push(1, 2, 3)
  store('test')[0] = 5
  store.undo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3])
  store.redo('test')
  t.deepEqual(store('test').slice(), [5, 2, 3])
})

test('Store undo/redo works with replacing', function(t) {
  const store = mobxstore()
  store('test').replace([1, 2, 3])
  store.undo('test')
  t.deepEqual(store('test').slice(), [])
  store.redo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3])
})

test('Store undo/redo works with pushing', function(t) {
  const store = mobxstore()
  store('test').push(1, 2, 3)
  store.undo('test')
  t.deepEqual(store('test').slice(), [])
  store.redo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3])
})

test('Store undo/redo works with removal', function(t) {
  const store = mobxstore({ test: [1, 2, 3, 4, 5] })
  store('test').replace(pull(1)(store('test')))
  t.deepEqual(store('test').slice(), [2, 3, 4, 5])
  store.undo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3, 4, 5])
})

test('Store undo/redo works when called in succession multiple times', function(t) {
  const store = mobxstore()
  store('test').replace([1, 2, 3])
  store('test').replace([4, 2, 3])
  store('test').replace([5, 2, 3])
  store('test').replace([7, 2, 3])
  store.undo('test')
  store.undo('test')
  store.undo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3])
  store.redo('test')
  t.deepEqual(store('test').slice(), [4, 2, 3])
  store.redo('test')
  store.redo('test')
  t.deepEqual(store('test').slice(), [7, 2, 3])
})

test('Store limits undo history', function(t) {
  const store = mobxstore({}, { historyLimit: 1 })
  store('x').push(1, 2, 3)
  store('x').push(1, 2, 3)
  store('x').push(1, 2, 3)
  store('x').push(1, 2, 3)
  store('x').push(1, 2, 3)
  t.is(store('x').__past.length, 1)
})
