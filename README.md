# rememoize*
Memoize results of async functions and refresh them periodically in background.

\* May contain traces of sin and unicorn tears.


## Installation

`npm install rememoize`


## Usage

Wrap an async function with `rememoize` like so:

```js
var rememoize = require('rememoize')
var rememoizedFunction = rememoize(<asyncFunction>, [options])

rememoizedFunction(<callback>)
```

Argument `options` is optional and may specify the following values:

```js
{
  initialValue    :  [any_value]
  refreshInterval :  [milliseconds]
}
```

- `initialValue`  If set, specifies an initial value that will be returned immediately on first call to rememoized function. If not set, initial calls will be queued up until first iteration has completed.
- `refreshInterval`  If set, specifies the interval at which the rememoized function will be refreshed in background. If not, the given async function will only be called once (and it's result will be cached).


## Examples

```js
var rememoize = require('rememoize')

var rememoizedFunction = rememoize(function(done) {
  // Awww, this takes long to complete
  doLongRunningAsyncStuff(function(err, result) {
    done(err, result)
  })
}, {
  initialValue: 'my initial value',
  refreshInterval: 1000
})

rememoizedFunction(function(err, result) {
  if (err) throw err
  console.log('Got result:', result)
})
```
