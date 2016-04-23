# mobx-store

[![CircleCI](https://img.shields.io/circleci/project/AriaFallah/mobx-store.svg?style=flat-square)](https://circleci.com/gh/AriaFallah/mobx-store)
[![npm](https://img.shields.io/npm/v/mobx-store.svg?style=flat-square)](https://www.npmjs.com/package/mobx-store)
[![Coveralls](https://img.shields.io/coveralls/AriaFallah/mobx-store.svg?style=flat-square)](https://coveralls.io/github/AriaFallah/mobx-store)

A simple observable data store for mobx with time traveling state, a lodash API, and plugin
support for reading and writing to an external store.

* [Installation](#installation)
* [Usage](#usage)
  * [Reading from and writing to the store](#reading-from-and-writing-to-the-store)
  * [Reading from and writing to an external store](#reading-from-and-writing-to-an-external-store)
  * [Accessing state history](#accessing-state-history)
  * [Using with react](#using-with-react)
* [Credit](#credit)

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

## Usage

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
const store = mobxstore()
```

and to get access to specific key such as numbers you would just call

```js
store('numbers') // <---- array at numbers. Ready to read or write to it.
```

#### Reading from and writing to the store

mobx-store has a simple [lodash](https://github.com/lodash/lodash) powered API.

* Reading from the store is as simple as passing lodash methods to the store function. In order to
pass methods to the store without actually executing them you can import from `lodash/fp`.

* Writing to the store is done by calling the regular array methods on the store object.


```js
import { filter } from 'lodash/fp'
import mobxstore from 'mobx-store'

const store = mobxstore()

store('numbers') // read current value of store -- []
store('numbers').replace([1, 2, 3]) // write [1, 2, 3] to store
store('numbers', filter((v) => v > 1)) // read [2, 3] from store
```

You can also chain methods to create more complex queries by passing an array of functions to the
store.

```js
import { forEach, map, sortBy, take, toUpper } from 'lodash/fp'
import mobxstore from 'mobx-store'

const store = mobxstore()

const users = [{
  id: 1,
  name: 'a'
}, {
  id: 2,
  name: 'b'
}, {
  id: 3,
  name: 'c'
}, {
  id: 4,
  name: 'd'
}, {
  id: 5,
  name: 'e'
}]

// put users into the store
store('users').replace(users)

// Get the top 3 users by id
const top3 = store('users', [sortBy('id'), take(3)])
```

If you save the result of one of your queries to a variable,
you can continue working with the variable by using the `chain` API

```js
// Get the names with the top 3 ids
store.chain(top3, map('name')) // ['a', 'b', 'c']

// Get the names of the top 3 ids capitalized
store.chain(top3, map((v) => toUpper(v.name)))

// Map doesn't mutate so value is the same
store.chain(top3, map('name')) // ['a', 'b', 'c']

// Mutate the names of the top 3 ids so they're capitalized
store.chain(top3, forEach((v) => v.name = toUpper(v.name)))

// Get the mutated names
store.chain(top3, map('name')) // ['A', 'B', 'C']
```

#### Reading from and writing to an external store

Reading and writing to an external store is done completely automatically. All you need to do is
specify it as a storage option. For example mobx-store comes with an adapter for reading and
writing to localstorage.

```js
import mobxstore from 'mobx-store'
import storage from 'mobx-store/localstorage'

// Name your external store, and pass it in
const store = mobxstore('local', { storage })
```

and you're done. Every change you make to this instance of mobx-store will persist to localstorage,
and the next time you open your app, it'll read the data from localstorage back into the store.

To roll out your own external store all you need to do is expose a read and write function on an
object, and pass it to the store as a storage option.

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

One of the best things about the store is that you can use it with `mobx-react` like any other
observable.

For example to display some lists of objects, that automatically updates the view when you add
another one.

```js
import React from 'react'
import mobxstore from 'mobx-store'
import { observer } from 'mobx-react'

const store = mobxstore()
store('objects').replace([{ name: 'test' }])

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
* A lot of the core is a reimplementation of https://github.com/typicode/lowdb to work with mobx.
You should check it out if you ever want a data store that doesn't use mobx.
