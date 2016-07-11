# mobx-store

[![CircleCI](https://img.shields.io/circleci/project/AriaFallah/mobx-store/master.svg?style=flat-square)](https://circleci.com/gh/AriaFallah/mobx-store)
[![npm](https://img.shields.io/npm/v/mobx-store.svg?style=flat-square)](https://www.npmjs.com/package/mobx-store)
[![Coveralls](https://img.shields.io/coveralls/AriaFallah/mobx-store.svg?style=flat-square)](https://coveralls.io/github/AriaFallah/mobx-store)

A data store with declarative querying, observable state, and easy undo/redo.

* [Why](#why)
  * [Query your data declaratively like it is SQL](#query-your-data-declaratively-like-it-is-sql)
  * [Schedule reactions to state changes](#schedule-reactions-to-state-changes)
  * [Easy undo and redo](#easy-undo-and-redo)
  * [Easy interop with React](#easy-interop-with-react)
* [Example](#example)
* [Installation](#installation)
  * [Keeping your bundle small](#keeping-your-bundle-small)
* [Tutorial](#tutorial)
  * [Reading from and writing to the store](#reading-from-and-writing-to-the-store)
  * [Scheduling reactions to state change](#scheduling-reactions-to-state-change)
  * [Undo and redo](#undo-and-redo)
  * [Using with react](#using-with-react)
* [Credit](#credit)

## Why

#### Query your data declaratively like it is SQL
```js
import mobxstore from 'mobx-store'
import { filter, map, pick, sortBy, take } from 'lodash/fp'

// Create store
const store = mobxstore({ users: [] })

// SELECT name, age FROM users WHERE age > 18 ORDER BY age LIMIT 1
store('users', [map(pick(['name', 'age'])), filter((x) => x.age > 18), sortBy('age'), take(1)])
```

#### Schedule reactions to state changes
```js
import mobxstore from 'mobx-store'
import { filter } from 'lodash/fp'

function log(store) {
  console.log(store('numbers', filter((x) => x > 10)))
}

// Create empty store
const store = mobxstore({ numbers: [] })

// Schedule log so that it happens every time the store mutates
store.schedule([log, store])

// log is invoked on the push because the store mutated
store('numbers').push(1)
/*
  logs [] because 1 < 10
*/

// log is invoked on the push because the store mutated
store('numbers').push(12)
/*
  logs [12]
*/
```

#### Easy undo and redo

```js
store('test').push(1, 2, 3) // value of test is [1, 2, 3]
store.undo('test') // value of test is [] again
store.redo('test') // value of test is [1, 2, 3] again
```

#### Easy interop with React

One of the best things about the store is that you can use it with `mobx-react` because it's based
upon MobX. This also means that when you mutate your objects you don't need setState() calls because
MobX will handle all the updating for you.

```js
import React from 'react'
import mobxstore from 'mobx-store'
import { observer } from 'mobx-react'

const store = mobxstore({ objects: [] })

const Objects = observer(function() {
  function addCard() {
    store('objects').push({ name: 'test' })
  }
  return (
    <div>
      <button onClick={addCard}>Add New Card</button>
      <div>
        {store('objects').map((o, n) =>
          <div key={n}>
            {o.name}
          </div>
        )}
      </div>
    </div>
  )
})

export default Objects
```

## Example

Here's a quick demo I put together to demonstrate the observable state and undo/redo features. It
uses the code [you can find later in the README](#scheduling-reactions-to-state-change) to make
changes to the store automatically persist to localstorage.

![](http://i.imgur.com/cMCSeOh.gif)

## Installation

```
npm install --save mobx-store
```

#### Keeping your bundle small

If you're concerned about the extra weight that lodash will add to your bundle you can install
[babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash)

```
npm install --save-dev babel-plugin-lodash
```

and add it to your `.babelrc`

```js
{
  "presets": // es2015, stage-whatever
  "plugins": [/* other plugins */, "lodash"]
}
```

this way you can do modular imports, and reduce the size of your bundles on the frontend

```js
import { map, take, sortBy } from 'lodash/fp'
```

## Tutorial

The store is structured as an object that holds either an array or object for each key.
For example, something like

```js
{
  numbers: [],
  ui: {}
}
```

To create a store all you need to do is

```js
import mobxstore from 'mobx-store'

// Create empty store and initialize later
const store = mobxstore()
store.set('users', [])

// Create store with initial state
const store = mobxstore({
  users: [{ name: 'joe', id: 1 }]
})
```

and to get access to specific key such as users you would just call.

```js
store('users')
```

With arrays you can manipulate them as if they are native arrays, but if you made an object you
interact with it using the `get` and `set` methods

```js
store('ui').get('isVisible')
store('ui').set('isVisible', true)
```

#### Reading from and writing to the store

mobx-store has a simple [lodash](https://github.com/lodash/lodash) powered API.

* Reading from the store is as simple as passing lodash methods to the store function. In order to
pass methods to the store without actually executing them you can import from `lodash/fp`.

* Writing to the store is done by calling the regular array methods as well the methods MobX exposes
such as `replace` on the store object.

```js
import { filter } from 'lodash/fp'
import mobxstore from 'mobx-store'

const store = mobxstore({ numbers: [] })

store('numbers') // read current value of store -- []
store('numbers').replace([1, 2, 3]) // write [1, 2, 3] to store
store('numbers').push(4) // push 4 into the store
store('numbers', filter((v) => v > 1)) // read [2, 3, 4] from store
```

You can also chain methods to create more complex queries by passing an array of functions to the
store.

```js
import { filter, map, sortBy, take, toUpper } from 'lodash/fp'
import mobxstore from 'mobx-store'

const store = mobxstore({ users: [] })

// Sort users by id and return an array of those with ids > 20
const result = store('users', [sortBy('id'), filter((x) => x.id > 20)])
```

If you save the result of one of your queries to a variable,
you can continue working with the variable by using the `chain` API

```js
// Take the top 3, and return an array of their names
store.chain(result, [take(3), map('name')])

// Filter again to get those with ids less than 100, take the top 2, and return an array of their names capitalized
store.chain(result, [filter((x) => x.id < 100), take(2), map((v) => toUpper(v.name))])
```

#### Scheduling reactions to state change

Reacting to state changes is done through the `schedule` API. You pass one to many arrays to the function.
The first element of the array is your function, and the following elements are the arguments of your array.

For example mobx-store comes with an adapter for reading and writing to localstorage, which looks
like this.

```js
function read(source) {
  const data = localStorage.getItem(source)
  if (data) {
    return JSON.parse(data)
  }
  return {}
}

function write(dest, obj) {
  return localStorage.setItem(dest, JSON.stringify(obj))
}

export default { read, write }
```

Using this we can schedule writing to the localstorage whenever the store mutates.

```js
import mobxstore from 'mobx-store'
import localstorage from 'mobx-store/localstorage'

// Create store initialized with value of localstorage at "info"
const store = mobxstore(localstorage.read('info'))

// schedule a reaction to changes to the state of the store
store.schedule([localstorage.write, 'info', store])
```

and you're done. Every change you make to this instance of mobx-store will persist to localstorage.

#### Undo and redo

To use undo and redo pass the name of a key in your store as a parameter. Make sure not to undo if
you haven't altered the state of your store, or if you have called it too many times already, and
likewise make sure not to call redo if you haven't yet called undo.

```js
import mobxstore from 'mobx-store'

const store = mobxstore({ x: [] })

store.undo('x') // error

store('x').push(1)
store.undo('x') // undo push
store.redo('x') // redo push

store.redo('x') // error
```

You can avoid errors by using the functions `canRedo` and `canUndo`

```js
if (store.canUndo('x')) {
  store.undo('x')
}
if (store.canRedo('x')) {
  store.redo('x')
}
```

You can limit the history of the undo by passing `limitHistory` to the store config

```js
// Can only undo up to 10 times
const store = mobxstore({}, { limitHistory: 10 })
```

Limiting history should be usually be unnecessary as mobx-store doesn't store the entire object in
history like Redux does, which potentially can take up a lot of memory. Instead, it only stores
information about what changed, and only creates the new state when you call undo or redo.

#### Using with React

Read and apply the instructions you can find at [mobx-react](https://github.com/mobxjs/mobx-react)
to make your components update when your store updates. The gist of it is that you just

```js
import { observer } from 'mobx-react'
```

and wrap the component that is using your store in it.

## Credit

* Thanks to @mweststrate for writing https://github.com/mobxjs/mobx
* The declarative querying is an improvement upon the cool ideas here https://github.com/typicode/lowdb
