import test from 'ava'
import mobxstore from '../src'
import { partial } from 'lodash'

test('Store undo/redo throws at proper times', function(t) {
  const store = mobxstore({ test: [] })
  t.throws(partial(store.undo, 'test'))
  t.throws(partial(store.redo, 'test'))
  store('test')
  t.throws(partial(store.undo, 'test'))
  t.throws(partial(store.redo, 'test'))
  store('test').replace([1, 2, 3])
  t.throws(partial(store.redo, 'test'))
})

test('Throws for unset keys', function(t) {
  const store = mobxstore()
  t.throws(partial(store, 'test'))
})
