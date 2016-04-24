# mobx-store

[![CircleCI](https://img.shields.io/circleci/project/AriaFallah/mobx-store/master.svg?style=flat-square)](https://circleci.com/gh/AriaFallah/mobx-store)
[![npm](https://img.shields.io/npm/v/mobx-store.svg?style=flat-square)](https://www.npmjs.com/package/mobx-store)
[![Coveralls](https://img.shields.io/coveralls/AriaFallah/mobx-store.svg?style=flat-square)](https://coveralls.io/github/AriaFallah/mobx-store)

A data store with declarative querying, observable state, and time traveling capability.

* [Why](#why)
  * [Query your data declaratively like it is SQL](#query-your-data-declaratively-like-it-is-sql)
  * [React to state changes automatically](#react-to-state-changes-automatically)
* [Installation](#installation)
* [Tutorial](#tutorial)
  * [Reading from and writing to the store](#reading-from-and-writing-to-the-store)
  * [Registering reactions to state change](#registering-reactions-to-state-change)
  * [Accessing state history](#accessing-state-history)
  * [Using with react](#using-with-react)
* [Credit](#credit)

## Why

#### Query your data declaratively like it is SQL
```js
import mobxstore from 'mobx-store'
import { filter, map, pick, sortBy, take } from 'lodash/fp'

// Create empty store
const store = mobxstore()

// SELECT name, age FROM users WHERE age > 18 ORDER BY age LIMIT 1
store('users', [map(pick(['name', 'age'])), filter((x) => x.age > 18), sortBy('age'), take(1)])
```

#### React to state changes automatically
```js
import mobxstore from 'mobx-store'

function logStore(storeObject) {
  // toJs converts the store object to plain js
  console.log(storeObject.toJs())
}

// Create empty store
const store = mobxstore()

// Register logStore so that it happens every time the store mutates
store.register([logStore, store.object])

// logStore is invoked on the push because the store mutated
store('numbers').push(1)
/*
  {
    numbers: [1]
  }
*/

// logStore is invoked on the push because the store mutated
store('numbers').push(2)
/*
  {
    numbers: [1, 2]
  }
*/
```

#### Easy Undo

## Installation

```
npm install --save mobx-store lodash
```

In order to prevent you from importing all of lodash into your frontend app, it's
recommended that you install [babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash)

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

The store is structured as an object that holds an array for each key. For example, something like

```js
{
  numbers: [],
  letters: []
}
```

To create a store all you need to do is

```js
import mobxstore from 'mobx-store'

// Create empty store
const store = mobxstore()

// Create store with initial state
const store = mobxstore({
  users: [{ name: 'joe', id: 1 }]
})
```

and to get access to specific key such as users you would just call

```js
store('users') // <---- array at numbers. Ready to read or write to it.
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

const store = mobxstore()

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

const store = mobxstore()

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

#### Registering reactions to state change

Reacting to state changes is done through the `register` API. You pass one to many arrays to the function. The first element of the array is your function, and the following elements are the arguments of your array.

For example mobx-store comes with an adapter for reading and writing to localstorage.

```js
import mobxstore from 'mobx-store'
import localstorage from 'mobx-store/localstorage'

// Create store initialized with value of localstorage at "info"
const store = mobxstore(localstorage.read('info'))

// Register a reaction to changes to the state of the store
store.register([localstorage.write, 'info', store.object])
```

and you're done. Every change you make to this instance of mobx-store will persist to localstorage.

#### Accessing state history

Every time you mutate your store, the new state will be pushed into an array, allowing you to have
a history of the changes you've made.

The state is exposed as a property of your store called `states`.

```js
import mobxstore from 'mobx-store'
const store = mobxstore()

store.states // <--- [{}]

// Change the state of the store a lot
store('time').replace([1, 2, 3])
store('time').replace([4, 2, 3])
store('travel').replace([1, 3, 3])
store('travel').replace([1, 2, 3])

store.states
/*
[
  {},
  { time: [] },
  { time: [1, 2, 3] },
  { time: [4, 2, 3] },
  { time: [4, 2, 3], travel: [] },
  { time: [4, 2, 3], travel: [1, 3, 3] },
  { time: [4, 2, 3], travel: [1, 2, 3] }
]
*/
```

#### Using with react

One of the best things about the store is that you can use it with `mobx-react` because it's based upon mobx.

For example to display some lists of objects, that automatically updates the view when you add
another one.

```js
import React from 'react'
import mobxstore from 'mobx-store'
import { observer } from 'mobx-react'

const store = mobxstore()

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

## Credit

* Thanks to @mweststrate for writing https://github.com/mobxjs/mobx
* The declarative querying is an improvement upon the cool ideas here https://github.com/typicode/lowdb
