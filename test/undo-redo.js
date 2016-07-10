import test from 'ava'
import mobxstore from '../src'
import { autorun } from 'mobx'
import { pull } from 'lodash/fp'

test('Store undo/redo triggers autorun', function(t) {
  let i = 0
  const store = mobxstore({ test: [] })
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
  const store = mobxstore({ test: [] })
  store('test').push(1, 2, 3)
  store('test')[0] = 5
  store.undo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3])
  store.redo('test')
  t.deepEqual(store('test').slice(), [5, 2, 3])
})

test('Store undo/redo works with maps', function(t) {
  const store = mobxstore({ test: { a: 1, b: 2, c: 3 } })
  store('test').set('a', 2)
  store.undo('test')
  t.deepEqual(store('test').toJS(), { a: 1, b: 2, c: 3 })
  store.redo('test')
  t.deepEqual(store('test').toJS(), { a: 2, b: 2, c: 3 })
})

test('Store undo/redo works with replacing', function(t) {
  const store = mobxstore({ test: [] })
  store('test').replace([1, 2, 3, 4])
  store('test').replace([1, 2, 3])
  store.undo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3, 4])
  store.redo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3])
})

test('Store undo/redo works with pushing', function(t) {
  const store = mobxstore({ test: [] })
  store('test').push(1, 2, 3)
  store('test').push(1, 2, 3)
  store.undo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3])
  store.redo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3, 1, 2, 3])
})

test('Store undo/redo works with removal', function(t) {
  const store = mobxstore({ test: [1, 2, 3, 4, 5] })
  store('test').replace(pull(1)(store('test')))
  t.deepEqual(store('test').slice(), [2, 3, 4, 5])
  store.undo('test')
  t.deepEqual(store('test').slice(), [1, 2, 3, 4, 5])
  store.redo('test')
  t.deepEqual(store('test').slice(), [2, 3, 4, 5])
})

test('Store undo/redo works when called in succession multiple times', function(t) {
  const store = mobxstore({ test: [] })
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
  const store = mobxstore({ test: [] }, { historyLimit: 1 })
  store('test').push(1, 2, 3)
  store('test').push(1, 2, 3)
  store('test').push(1, 2, 3)
  store('test').push(1, 2, 3)
  store('test').push(1, 2, 3)
  t.is(store('test').__past.length, 1)
})

test('Store should not have undo history', function(t) {
  const store = mobxstore({ test: [], test2: {} }, { noHistory: true })
  t.is(store('test').__past, undefined)
})

test('Store passes down the parent reference', function(t) {
  const store = mobxstore({ test: [] })
  store('test').push({})
  t.is(store('test')[0].__parent, store('test'))
})

test('Store passes down the parent reference multiple levels', function(t) {
  const store = mobxstore({ test: [] })
  store('test').push({ a: { b: { c: {}, d: { e: [{}, {}, {}] } } } })
  t.is(store('test')[0].__parent, store('test'))
  t.is(store('test')[0].a.__parent, store('test'))
  t.is(store('test')[0].a.b.c.__parent, store('test'))
  t.is(store('test')[0].a.b.d.e[1].__parent, store('test'))
})

test('Store can deeply undo and redo history', function(t) {
  const store = mobxstore({ test: [] })
  store('test').push({ person: { name: 'joe', age: 15 } })
  store('test')[0].person.name = 'ricky'
  t.deepEqual(store('test').slice(), [{ person: { name: 'ricky', age: 15 } }])
  store.undo('test')
  t.deepEqual(store('test').slice(), [{ person: { name: 'joe', age: 15 } }])
  store.redo('test')
  t.deepEqual(store('test').slice(), [{ person: { name: 'ricky', age: 15 } }])
})
