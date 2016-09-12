/* eslint-env jest */

import { watchHistory, undo, redo } from '../src'
import { action, extendObservable, observable, asMap, useStrict } from 'mobx'

useStrict(true)
watchHistory()

test('Undo/Redo works with arrays', function() {
  const obs = observable([1, 2, 3])
  action('Mutate Array', function(x) {
    x.replace([1, 2, 3])
    x[0] = 4
    x[1] = 5
    x[2] = 6
    x.replace([4, 5, 6])
  })(obs)
  expect(obs.slice()).toEqual([4, 5, 6])
  undo('Mutate Array')
  expect(obs.slice()).toEqual([1, 2, 3])
  redo('Mutate Array')
  expect(obs.slice()).toEqual([4, 5, 6])
  undo('Mutate Array')
  expect(obs.slice()).toEqual([1, 2, 3])
})

test('Undo/Redo works with objects', function() {
  const obs = observable({ a: 1, b: 2, c: 3 })
  action('Mutate Object', function(x) {
    x.a = 4
    x.b = 5
    x.c = 6
    extendObservable(x, { d: 7 })
  })(obs)
  expect(obs).toEqual({ a: 4, b: 5, c: 6, d: 7 })
  undo('Mutate Object')
  expect(obs).toEqual({ a: 1, b: 2, c: 3 })
  redo('Mutate Object')
  expect(obs).toEqual({ a: 4, b: 5, c: 6, d: 7 })
  undo('Mutate Object')
  expect(obs).toEqual({ a: 1, b: 2, c: 3 })
})

test('Undo/Redo works with maps', function() {
  const obs = observable(asMap({ a: 1, b: 2, c: 3 }))
  action('Mutate Map', function(x) {
    x.set('a', 4)
    x.set('b', 5)
    x.set('c', 6)
    x.set('d', 7)
    x.delete('d')
  })(obs)
  expect(obs.toJS()).toEqual({ a: 4, b: 5, c: 6 })
  undo('Mutate Map')
  expect(obs.toJS()).toEqual({ a: 1, b: 2, c: 3 })
  redo('Mutate Map')
  expect(obs.toJS()).toEqual({ a: 4, b: 5, c: 6 })
  undo('Mutate Map')
  expect(obs.toJS()).toEqual({ a: 1, b: 2, c: 3 })
})

test('Calling undo/redo when nothing has changed does nothing', function() {
  const obs = observable(asMap({ a: 1, b: 2, c: 3 }))
  action('Mutate Map', function(x) {
    x.set('a', 4)
    x.set('b', 5)
    x.set('c', 6)
    x.set('d', 7)
    x.delete('d')
  })(obs)
  redo('Mutate Map')
  redo('Mutate Map')
  redo('Mutate Map')
  expect(obs.toJS()).toEqual({ a: 4, b: 5, c: 6 })
  undo('Mutate Map')
  undo('Mutate Map')
  undo('Mutate Map')
  expect(obs.toJS()).toEqual({ a: 1, b: 2, c: 3 })
})
