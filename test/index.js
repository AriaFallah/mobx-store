import test from 'ava'
import mobxstore from '../src'
import { autorun } from 'mobx'
import { map, find, filter, toUpper, sortBy, take, pick } from 'lodash/fp'

test('Store works when calling a single method', function(t) {
  let i = 0
  const store = mobxstore({ test: [] })
  store('test').replace([1, 2, 3])
  store('test').push(4)
  autorun(() => i += noop(store('test')[0]))
  store('test').replace([4, 5, 6])
  t.is(i, 2)
})

test('Store should not report a change when nothing changes', function(t) {
  let i = 0
  const store = mobxstore({ test: [] })
  store('test').replace([{ a: 1 }, { b: 2 }, { c: 3 }])
  autorun(() => i += noop(store('test')[0]))
  store('test', find({ a: 1 }))
  t.not(i, 2)
})

test('Store works when chaining', function(t) {
  let i = 0
  const store = mobxstore({ test: [] })
  store('test').replace([{ a: 1 }, { b: 2 }, { c: 3 }])
  autorun(() => i += noop(store('test')[0].a))
  store('test', find({ a: 1 })).a = 'wow'
  t.is(i, 2)
})

test('Examples in docs work', function(t) {
  const users = [{
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
  const store = mobxstore({
    users,
    numbers: []
  })
  const result = store('users', [map(pick(['name', 'age'])), filter((x) => x.age > 18), sortBy('age'), take(1)])
  t.deepEqual(result, [{ name: 'a', age: 20 }])
  store('numbers').replace([1, 2, 3])
  store('numbers').push(4)
  t.deepEqual(store('numbers', filter((v) => v > 1)), [2, 3, 4])
  const result2 = store('users', [sortBy('id'), filter((x) => x.id > 20)])
  t.deepEqual(store.chain(result2, [take(3), map('name')]), ['b', 'e', 'c'])
  t.deepEqual(store.chain(result2, [filter((x) => x.id < 100), take(2), map((v) => toUpper(v.name))]), ['B', 'E'])
})

function noop() {
  return 1
}
