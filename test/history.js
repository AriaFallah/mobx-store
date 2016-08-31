import test from 'ava'
import { action, observable, asMap } from 'mobx'
import { watchHistory, undo, redo } from '../src'

watchHistory()

test('Undo/Redo works with arrays', function(t) {
  const obs = observable([1, 2, 3])
  action('Mutate Array', function(x) {
    x[0] = 4
    x[1] = 5
    x[2] = 6
  })(obs)
  t.deepEqual(obs.slice(), [4, 5, 6])
  undo('Mutate Array')
  t.deepEqual(obs.slice(), [1, 2, 3])
  redo('Mutate Array')
  t.deepEqual(obs.slice(), [4, 5, 6])
  undo('Mutate Array')
  t.deepEqual(obs.slice(), [1, 2, 3])
})

test('Undo/Redo works with objects', function(t) {
  const obs = observable({ a: 1, b: 2, c: 3 })
  action('Mutate Object', function(x) {
    x.a = 4
    x.b = 5
    x.c = 6
  })(obs)
  t.deepEqual(obs, { a: 4, b: 5, c: 6 })
  undo('Mutate Object')
  t.deepEqual(obs, { a: 1, b: 2, c: 3 })
  redo('Mutate Object')
  t.deepEqual(obs, { a: 4, b: 5, c: 6 })
  undo('Mutate Object')
  t.deepEqual(obs, { a: 1, b: 2, c: 3 })
})

test('Undo/Redo works with maps', function(t) {
  const obs = observable(asMap({ a: 1, b: 2, c: 3 }))
  action('Mutate Map', function(x) {
    x.set('a', 4)
    x.set('b', 5)
    x.set('c', 6)
  })(obs)
  t.deepEqual(obs.toJS(), { a: 4, b: 5, c: 6 })
  undo('Mutate Map')
  t.deepEqual(obs.toJS(), { a: 1, b: 2, c: 3 })
  redo('Mutate Map')
  t.deepEqual(obs.toJS(), { a: 4, b: 5, c: 6 })
  undo('Mutate Map')
  t.deepEqual(obs.toJS(), { a: 1, b: 2, c: 3 })
})
