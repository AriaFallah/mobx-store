/* eslint-env jest */

import { chain } from '../src'
import { observable, asMap } from 'mobx'
import { map, filter, toUpper, sortBy, take, pick, values } from 'lodash/fp'

test('Chaining works with arrays', function() {
  const obs = observable([1, 2, 3])
  expect(chain(obs, [filter((x) => x > 1), take(1)])).toEqual([2])
})

test('Chaining works with objects', function() {
  const obs = observable({ a: 1, b: 2, c: 3 })
  expect(chain(obs, [values(), filter((x) => x > 1), take(1)])).toEqual([2])
})

test('Chaining works with maps', function() {
  const obs = observable(asMap({ a: 1, b: 2, c: 3 }))
  expect(chain(obs, [values(), filter((x) => x > 1), take(1)])).toEqual([2])
})

test('Advanced examples work', function() {
  const users = observable(
    [{
      id: 15,
      age: 20,
      name: 'a'
    }, {
      id: 25,
      age: 21,
      name: 'b'
    }, {
      id: 77,
      age: 22,
      name: 'c'
    }, {
      id: 101,
      age: 23,
      name: 'd'
    }, {
      id: 45,
      age: 24,
      name: 'e'
    }]
  )
  const result2 = chain(users, [sortBy('id'), filter((x) => x.id > 20)])

  expect(chain(result2, [
    take(3),
    map('name')])
  ).toEqual(['b', 'e', 'c'])

  expect(chain(result2, [
    filter((x) => x.id < 100),
    take(2),
    map((v) => toUpper(v.name))])
  ).toEqual(['B', 'E'])

  expect(chain(users, [
    map(pick(['name', 'age'])),
    filter((x) => x.age > 18),
    sortBy('age'),
    take(1)])
  ).toEqual([{ name: 'a', age: 20 }])
})
