# Promise

A Promise is an object that represents a value that will exist in the future, but doesn't right now. Promises allow you to then attach callbacks that can run once the value becomes available (known as *resolving*), or if an error has occurred (known as *rejecting*).

# NOTE:

**This file describes Promise use in Luau format. Typescript use should be similar, but with some differences in syntax.
For example, Promise.new would be translate to `new Promise()`.**

## Types

### `Status`

*enum*

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L205)

```lua
interface Status {
  Started: "Started", -- The Promise is executing, and not settled yet.
  Resolved: "Resolved", -- The Promise finished successfully.
  Rejected: "Rejected", -- The Promise was rejected.
  Cancelled: "Cancelled", -- The Promise was cancelled before it finished.
}
```

An enum value used to represent the Promise's status.

## Properties

### `Status`

*Read Only, enums*

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L212)

```lua
Promise.Status: Status
```

A table containing all members of the `Status` enum, e.g., `Promise.Status.Resolved`.

## Functions

### `new`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L349)

```lua
Promise.new(
  executor: (
    resolve: (...: any) -> (),
    reject: (...: any) -> (),
    onCancel: (abortHandler?: () -> ()) -> boolean
  ) -> ()
) -> Promise
```

Construct a new Promise that will be resolved or rejected with the given callbacks.

If you `resolve` with a Promise, it will be chained onto.

You can safely yield within the executor function and it will not block the creating thread.

```lua
local myFunction()
    return Promise.new(function(resolve, reject, onCancel)
        wait(1)
        resolve("Hello world!")
    end)
end

myFunction():andThen(print)
```

You do not need to use `pcall` within a Promise. Errors that occur during execution will be caught and turned into a rejection automatically. If `error()` is called with a table, that table will be the rejection value. Otherwise, string errors will be converted into `Promise.Error(Promise.Error.Kind.ExecutionError)` objects for tracking debug information.

You may register an optional cancellation hook by using the `onCancel` argument:

*   This should be used to abort any ongoing operations leading up to the promise being settled.
*   Call the `onCancel` function with a function callback as its only argument to set a hook which will in turn be called when/if the promise is cancelled.
*   `onCancel` returns `true` if the Promise was already cancelled when you called `onCancel`.
*   Calling `onCancel` with no argument will not override a previously set cancellation hook, but it will still return `true` if the Promise is currently cancelled.
*   You can set the cancellation hook at any time before resolving.
*   When a promise is cancelled, calls to `resolve` or `reject` will be ignored, regardless of if you set a cancellation hook or not.

> **Caution:**
> If the Promise is cancelled, the `executor` thread is closed with `coroutine.close` after the cancellation hook is called.
>
> You must perform any cleanup code in the cancellation hook: any time your executor yields, it **may never resume**.

### `defer`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L375)

```lua
Promise.defer(
  executor: (
    resolve: (...: any) -> (),
    reject: (...: any) -> (),
    onCancel: (abortHandler?: () -> ()) -> boolean
  ) -> ()
) -> Promise
```

The same as `Promise.new`, except execution begins after the next `Heartbeat` event.

This is a spiritual replacement for `spawn`, but it does not suffer from the same [issues](https://eryn.io/gist/3db84579866c099cdd5bb2ff37947cec) as `spawn`.

```lua
local function waitForChild(instance, childName, timeout)
  return Promise.defer(function(resolve, reject)
    local child = instance:WaitForChild(childName, timeout)

    ;(child and resolve or reject)(child)
  end)
end
```

### `resolve`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L418)

```lua
Promise.resolve(...: any) -> Promise<...any>
```

Creates an immediately resolved Promise with the given value.

```lua
-- Example using Promise.resolve to deliver cached values:
function getSomething(name)
    if cache[name] then
        return Promise.resolve(cache[name])
    else
        return Promise.new(function(resolve, reject)
            local thing = getTheThing()
            cache[name] = thing

            resolve(thing)
        end)
    end
end
```

### `reject`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L435)

```lua
Promise.reject(...: any) -> Promise<...any>
```

Creates an immediately rejected Promise with the given value.

> **Caution:**
> Something needs to consume this rejection (i.e. `:catch()` it), otherwise it will emit an unhandled Promise rejection warning on the next frame. Thus, you should not create and store rejected Promises for later use. Only create them on-demand as needed.

### `try`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L477)

```lua
Promise.try(
  callback: (...: T...) -> ...any,
  ...: T... -- Additional arguments passed to `callback`
) -> Promise
```

Begins a Promise chain, calling a function and returning a Promise resolving with its return value. If the function errors, the returned Promise will be rejected with the error. You can safely yield within the `Promise.try` callback.

> **Info:**
> `Promise.try` is similar to `Promise.promisify`, except the callback is invoked immediately instead of returning a new function.

```lua
Promise.try(function()
    return math.random(1, 2) == 1 and "ok" or error("Oh an error!")
end)
    :andThen(function(text)
        print(text)
    end)
    :catch(function(err)
        warn("Something went wrong")
    end)
```

### `all`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L591)

```lua
Promise.all(promises: {Promise<T>}) -> Promise<{T}>
```

Accepts an array of Promises and returns a new promise that:

*   is resolved after all input promises resolve.
*   is rejected if *any* input promises reject.

> **Info:**
> Only the first return value from each promise will be present in the resulting array.

After any input Promise rejects, all other input Promises that are still pending will be cancelled if they have no other consumers.

```lua
local promises = {
    returnsAPromise("example 1"),
    returnsAPromise("example 2"),
    returnsAPromise("example 3"),
}

return Promise.all(promises)
```

### `fold`

*since v3.1.0*
[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L620)

```lua
Promise.fold(
  list: {T | Promise<T>},
  reducer: (
    accumulator: U,
    value: T,
    index: number
  ) -> U | Promise<U>,
  initialValue: U
) -> ()
```

Folds an array of values or promises into a single value. The array is traversed sequentially.

The reducer function can return a promise or value directly. Each iteration receives the resolved value from the previous, and the first receives your defined initial value.

The folding will stop at the first rejection encountered.

```lua
local basket = {"blueberry", "melon", "pear", "melon"}
Promise.fold(basket, function(cost, fruit)
    if fruit == "blueberry" then
        return cost -- blueberries are free!
    else
        -- call a function that returns a promise with the fruit price
        return fetchPrice(fruit):andThen(function(fruitCost)
            return cost + fruitCost
        end)
    end
end, 0)
```

### `some`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L653)

```lua
Promise.some(
  promises: {Promise<T>},
  count: number
) -> Promise<{T}>
```

Accepts an array of Promises and returns a Promise that is resolved as soon as `count` Promises are resolved from the input array. The resolved array values are in the order that the Promises resolved in. When this Promise resolves, all other pending Promises are cancelled if they have no other consumers.

`count` 0 results in an empty array. The resultant array will never have more than `count` elements.

```lua
local promises = {
    returnsAPromise("example 1"),
    returnsAPromise("example 2"),
    returnsAPromise("example 3"),
}

return Promise.some(promises, 2) -- Only resolves with first 2 promises to resolve
```

### `any`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L677)

```lua
Promise.any(promises: {Promise<T>}) -> Promise<T>
```

Accepts an array of Promises and returns a Promise that is resolved as soon as *any* of the input Promises resolves. It will reject only if *all* input Promises reject. As soon as one Promises resolves, all other pending Promises are cancelled if they have no other consumers.

Resolves directly with the value of the first resolved Promise. This is essentially `Promise.some` with `1` count, except the Promise resolves with the value directly instead of an array with one element.

```lua
local promises = {
    returnsAPromise("example 1"),
    returnsAPromise("example 2"),
    returnsAPromise("example 3"),
}

return Promise.any(promises) -- Resolves with first value to resolve (only rejects if all 3 rejected)
```

### `allSettled`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L699)

```lua
Promise.allSettled(promises: {Promise<T>}) -> Promise<{Status}>
```

Accepts an array of Promises and returns a new Promise that resolves with an array of in-place Statuses when all input Promises have settled. This is equivalent to mapping `promise:finally` over the array of Promises.

```lua
local promises = {
    returnsAPromise("example 1"),
    returnsAPromise("example 2"),
    returnsAPromise("example 3"),
}

return Promise.allSettled(promises)
```

### `race`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L777)

```lua
Promise.race(promises: {Promise<T>}) -> Promise<T>
```

Accepts an array of Promises and returns a new promise that is resolved or rejected as soon as any Promise in the array resolves or rejects.

> **Warning:**
> If the first Promise to settle from the array settles with a rejection, the resulting Promise from `race` will reject.
>
> If you instead want to tolerate rejections, and only care about at least one Promise resolving, you should use `Promise.any` or `Promise.some` instead.

All other Promises that don't win the race will be cancelled if they have no other consumers.

```lua
local promises = {
    returnsAPromise("example 1"),
    returnsAPromise("example 2"),
    returnsAPromise("example 3"),
}

return Promise.race(promises) -- Only returns 1st value to resolve or reject
```

### `each`

*since 3.0.0*
[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L872)

```lua
Promise.each(
  list: {T | Promise<T>},
  predicate: (
    value: T,
    index: number
  ) -> U | Promise<U>
) -> Promise<{U}>
```

Iterates serially over the given an array of values, calling the predicate callback on each value before continuing.

If the predicate returns a Promise, we wait for that Promise to resolve before moving on to the next item in the array.

> **Info:**
> `Promise.each` is similar to `Promise.all`, except the Promises are ran in order instead of all at once.
>
> But because Promises are eager, by the time they are created, they're already running. Thus, we need a way to defer creation of each Promise until a later time.
>
> The predicate function exists as a way for us to operate on our data instead of creating a new closure for each Promise. If you would prefer, you can pass in an array of functions, and in the predicate, call the function and return its return value.

```lua
Promise.each({
    "foo",
    "bar",
    "baz",
    "qux"
}, function(value, index)
    return Promise.delay(1):andThen(function()
    print(("%d) Got %s!"):format(index, value))
    end)
end)

--[[
    (1 second passes)
    > 1) Got foo!
    (1 second passes)
    > 2) Got bar!
    (1 second passes)
    > 3) Got baz!
    (1 second passes)
    > 4) Got qux!
]]
```

If the Promise a predicate returns rejects, the Promise from `Promise.each` is also rejected with the same value.

If the array of values contains a Promise, when we get to that point in the list, we wait for the Promise to resolve before calling the predicate with the value.

If a Promise in the array of values is already Rejected when `Promise.each` is called, `Promise.each` rejects with that value immediately (the predicate callback will never be called even once). If a Promise in the list is already Cancelled when `Promise.each` is called, `Promise.each` rejects with `Promise.Error(Promise.Error.Kind.AlreadyCancelled)`. If a Promise in the array of values is Started at first, but later rejects, `Promise.each` will reject with that value and iteration will not continue once iteration encounters that value.

Returns a Promise containing an array of the returned/resolved values from the predicate for each item in the array of values.

If this Promise returned from `Promise.each` rejects or is cancelled for any reason, the following are true:

*   Iteration will not continue.
*   Any Promises within the array of values will now be cancelled if they have no other consumers.
*   The Promise returned from the currently active predicate will be cancelled if it hasn't resolved yet.

### `is`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L971)

```lua
Promise.is(object: any) -> boolean -- `true` if the given `object` is a Promise.
```

Checks whether the given object is a Promise via duck typing. This only checks if the object is a table and has an `andThen` method.

### `promisify`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1020)

```lua
Promise.promisify(callback: (...: any) -> ...any) -> (...: any) -> Promise
```

Wraps a function that yields into one that returns a Promise.

Any errors that occur while executing the function will be turned into rejections.

> **Info:**
> `Promise.promisify` is similar to `Promise.try`, except the callback is returned as a callable function instead of being invoked immediately.

```lua
local sleep = Promise.promisify(wait)

sleep(1):andThen(print)

local isPlayerInGroup = Promise.promisify(function(player, groupId)
    return player:IsInGroup(groupId)
end)
```

### `delay`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1044)

```lua
Promise.delay(seconds: number) -> Promise<number>
```

Returns a Promise that resolves after `seconds` seconds have passed. The Promise resolves with the actual amount of time that was waited.

This function is **not** a wrapper around `wait`. `Promise.delay` uses a custom scheduler which provides more accurate timing. As an optimization, cancelling this Promise instantly removes the task from the scheduler.

> **Warning:**
> Passing `NaN`, infinity, or a number less than 1/60 is equivalent to passing 1/60.

```lua
 Promise.delay(5):andThenCall(print, "This prints after 5 seconds")
```

### `retry`

*since 3.0.0*
[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1934)

```lua
Promise.retry(
  callback: (...: P) -> Promise<T>,
  times: number,
  ...?: P
) -> Promise<T>
```

Repeatedly calls a Promise-returning function up to `times` number of times, until the returned Promise resolves.

If the amount of retries is exceeded, the function will return the latest rejected Promise.

```lua
local function canFail(a, b, c)
    return Promise.new(function(resolve, reject)
        -- do something that can fail

        local failed, thing = doSomethingThatCanFail(a, b, c)

        if failed then
            reject("it failed")
        else
            resolve(thing)
        end
    end)
end

local MAX_RETRIES = 10
local value = Promise.retry(canFail, MAX_RETRIES, "foo", "bar", "baz") -- args to send to canFail
```

### `retryWithDelay`

*since v3.2.0*
[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1962)

```lua
Promise.retryWithDelay(
  callback: (...: P) -> Promise<T>,
  times: number,
  seconds: number,
  ...?: P
) -> Promise<T>
```

Repeatedly calls a Promise-returning function up to `times` number of times, waiting `seconds` seconds between each retry, until the returned Promise resolves.

If the amount of retries is exceeded, the function will return the latest rejected Promise.

### `fromEvent`

*since 3.0.0*
[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L2004)

```lua
Promise.fromEvent(
  event: Event, -- Any object with a `Connect` method. This includes all Roblox events.
  predicate?: (...: P) -> boolean -- A function which determines if the Promise should resolve with the given value, or wait for the next event to check again.
) -> Promise<P>
```

Converts an event into a Promise which resolves the next time the event fires.

The optional `predicate` callback, if passed, will receive the event arguments and should return `true` or `false`, based on if this fired event should resolve the Promise or not. If `true`, the Promise resolves. If `false`, nothing happens and the predicate will be rerun the next time the event fires.

The Promise will resolve with the event arguments.

> **Tip:**
> This function will work given any object with a `Connect` method. This includes all Roblox events.

```lua
-- Creates a Promise which only resolves when `somePart` is touched
-- by a part named `"Something specific"`.
return Promise.fromEvent(somePart.Touched, function(part)
    return part.Name == "Something specific"
end)
```

### `onUnhandledRejection`

*since v3.2.0*
[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L2056)

```lua
Promise.onUnhandledRejection(
  callback: (
    promise: Promise,
    ...: any
  ) -- A callback that runs when an unhandled rejection happens.
) -> () -> () -- Function that unregisters the `callback` when called
```

Registers a callback that runs when an unhandled rejection happens. An unhandled rejection happens when a Promise is rejected, and the rejection is not observed with `:catch`.

The callback is called with the actual promise that rejected, followed by the rejection values.

### `timeout`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1180)

```lua
Promise:timeout(
  seconds: number,
  rejectionValue?: any -- The value to reject with if the timeout is reached
) -> Promise
```

Returns a new Promise that resolves if the chained Promise resolves within `seconds` seconds, or rejects if execution time exceeds `seconds`. The chained Promise will be cancelled if the timeout is reached.

Rejects with `rejectionValue` if it is non-nil. If a `rejectionValue` is not given, it will reject with a `Promise.Error(Promise.Error.Kind.TimedOut)`. This can be checked with `Error.isKind`.

```lua
getSomething():timeout(5):andThen(function(something)
    -- got something and it only took at max 5 seconds
end):catch(function(e)
    -- Either getting something failed or the time was exceeded.

    if Promise.Error.isKind(e, Promise.Error.Kind.TimedOut) then
        warn("Operation timed out!")
    else
        warn("Operation encountered an error!")
    end
end)
```

Sugar for:

```lua
Promise.race({
    Promise.delay(seconds):andThen(function()
        return Promise.reject(
            rejectionValue == nil
            and Promise.Error.new({ kind = Promise.Error.Kind.TimedOut })
            or rejectionValue
        )
    end),
    promise
})
```

### `getStatus`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1204)

```lua
Promise:getStatus() -> Status
```

Returns the current Promise status.

### `andThen`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1283)

```lua
Promise:andThen(
  successHandler: (...: any) -> ...any,
  failureHandler?: (...: any) -> ...any
) -> Promise<...any>
```

Chains onto an existing Promise and returns a new Promise.

> **Warning:**
> Within the failure handler, you should never assume that the rejection value is a string. Some rejections within the Promise library are represented by `Error` objects. If you want to treat it as a string for debugging, you should call `tostring` on it first.

You can return a Promise from the success or failure handler and it will be chained onto.

Calling `andThen` on a cancelled Promise returns a cancelled Promise.

> **Tip:**
> If the Promise returned by `andThen` is cancelled, `successHandler` and `failureHandler` will not run.
>
> To run code no matter what, use `Promise:finally`.

### `catch`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1310)

```lua
Promise:catch(failureHandler: (...: any) -> ...any) -> Promise<...any>
```

Shorthand for `Promise:andThen(nil, failureHandler)`.

Returns a Promise that resolves if the `failureHandler` worked without encountering an additional error.

> **Warning:**
> Within the failure handler, you should never assume that the rejection value is a string. Some rejections within the Promise library are represented by `Error` objects. If you want to treat it as a string for debugging, you should call `tostring` on it first.

Calling `catch` on a cancelled Promise returns a cancelled Promise.

> **Tip:**
> If the Promise returned by `catch` is cancelled, `failureHandler` will not run.
>
> To run code no matter what, use `Promise:finally`.

### `tap`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1331)

```lua
Promise:tap(tapHandler: (...: any) -> ...any) -> Promise<...any>
```

Similar to `Promise.andThen`, except the return value is the same as the value passed to the handler. In other words, you can insert a `:tap` into a Promise chain without affecting the value that downstream Promises receive.

```lua
 getTheValue()
    :tap(print)
    :andThen(function(theValue)
        print("Got", theValue, "even though print returns nil!")
    end)
```

If you return a Promise from the tap handler callback, its value will be discarded but `tap` will still wait until it resolves before passing the original value through.

### `andThenCall`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1366)

```lua
Promise:andThenCall(
  callback: (...: any) -> any,
  ...?: any -- Additional arguments which will be passed to `callback`
) -> Promise
```

Attaches an `andThen` handler to this Promise that calls the given callback with the predefined arguments. The resolved value is discarded.

```lua
 promise:andThenCall(someFunction, "some", "arguments")
```

This is sugar for

```lua
 promise:andThen(function()
    return someFunction("some", "arguments")
    end)
```

### `andThenReturn`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1396)

```lua
Promise:andThenReturn(
  ...: any -- Values to return from the function
) -> Promise
```

Attaches an `andThen` handler to this Promise that discards the resolved value and returns the given value from it.

```lua
 promise:andThenReturn("some", "values")
```

This is sugar for

```lua
 promise:andThen(function()
        return "some", "values"
    end)
```

> **Caution:**
> Promises are eager, so if you pass a Promise to `andThenReturn`, it will begin executing before `andThenReturn` is reached in the chain. Likewise, if you pass a Promise created from `Promise.reject` into `andThenReturn`, it's possible that this will trigger the unhandled rejection warning. If you need to return a Promise, it's usually best practice to use `Promise.andThen`.

### `cancel`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1414)

```lua
Promise:cancel() -> ()
```

Cancels this promise, preventing the promise from resolving or rejecting. Does not do anything if the promise is already settled.

Cancellations will propagate upwards and downwards through chained promises.

Promises will only be cancelled if all of their consumers are also cancelled. This is to say that if you call `andThen` twice on the same promise, and you cancel only one of the child promises, it will not cancel the parent promise until the other child promise is also cancelled.

```lua
 promise:cancel()
```

### `finally`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1559)

```lua
Promise:finally(finallyHandler: (status: Status) -> ...any) -> Promise<...any>
```

Set a handler that will be called regardless of the promise's fate. The handler is called when the promise is resolved, rejected, *or* cancelled.

Returns a new Promise that:

*   resolves with the same values that this Promise resolves with.
*   rejects with the same values that this Promise rejects with.
*   is cancelled if this Promise is cancelled.

If the value you return from the handler is a Promise:

*   We wait for the Promise to resolve, but we ultimately discard the resolved value.
*   If the returned Promise rejects, the Promise returned from `finally` will reject with the rejected value from the *returned* promise.
*   If the `finally` Promise is cancelled, and you returned a Promise from the handler, we cancel that Promise too.

Otherwise, the return value from the `finally` handler is entirely discarded.

> **Cancellation:**
> As of Promise v4, `Promise:finally` does not count as a consumer of the parent Promise for cancellation purposes. This means that if all of a Promise's consumers are cancelled and the only remaining callbacks are finally handlers, the Promise is cancelled and the finally callbacks run then and there.
>
> Cancellation still propagates through the `finally` Promise though: if you cancel the `finally` Promise, it can cancel its parent Promise if it had no other consumers. Likewise, if the parent Promise is cancelled, the `finally` Promise will also be cancelled.

```lua
local thing = createSomething()

doSomethingWith(thing)
    :andThen(function()
        print("It worked!")
        -- do something..
    end)
    :catch(function()
        warn("Oh no it failed!")
    end)
    :finally(function()
        -- either way, destroy thing

        thing:Destroy()
    end)
```

### `finallyCall`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1573)

```lua
Promise:finallyCall(
  callback: (...: any) -> any,
  ...?: any -- Additional arguments which will be passed to `callback`
) -> Promise
```

Same as `andThenCall`, except for `finally`.

Attaches a `finally` handler to this Promise that calls the given callback with the predefined arguments.

### `finallyReturn`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1599)

```lua
Promise:finallyReturn(
  ...: any -- Values to return from the function
) -> Promise
```

Attaches a `finally` handler to this Promise that discards the resolved value and returns the given value from it.

```lua
 promise:finallyReturn("some", "values")
```

This is sugar for

```lua
 promise:finally(function()
        return "some", "values"
    end)
```

### `awaitStatus`

*Yields*
[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1613)

```lua
Promise:awaitStatus() -> (
  Status, -- The Status representing the fate of the Promise
  ...any -- The values the Promise resolved or rejected with.
)
```

Yields the current thread until the given Promise completes. Returns the Promise's status, followed by the values that the promise resolved or rejected with.

### `await`

*Yields*
[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1666)

```lua
Promise:await() -> (
  boolean, -- `true` if the Promise successfully resolved
  ...any -- The values the Promise resolved or rejected with.
)
```

Yields the current thread until the given Promise completes. Returns true if the Promise resolved, followed by the values that the promise resolved or rejected with.

> **Caution:**
> If the Promise gets cancelled, this function will return `false`, which is indistinguishable from a rejection. If you need to differentiate, you should use `Promise.awaitStatus` instead.

```lua
 local worked, value = getTheValue():await()

if worked then
    print("got", value)
else
    warn("it failed")
end
```

### `expect`

*Yields*
[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1703)

```lua
Promise:expect() -> ...any -- The values the Promise resolved with.
```

Yields the current thread until the given Promise completes. Returns the values that the promise resolved with.

```lua
local worked = pcall(function()
    print("got", getTheValue():expect())
end)

if not worked then
    warn("it failed")
end
```

This is essentially sugar for:

```lua
select(2, assert(promise:await()))
```

**Errors** if the Promise rejects or gets cancelled.

**Errors:**

| Type | Description                                                        |
| :--- | :----------------------------------------------------------------- |
| any  | Errors with the rejection value if this Promise rejects or gets cancelled. |

### `now`

[Source](https://github.com/evaera/roblox-lua-promise/blob/master/lib/init.lua#L1889)

```lua
Promise:now(
  rejectionValue?: any -- The value to reject with if the Promise isn't resolved
) -> Promise
```

Chains a Promise from this one that is resolved if this Promise is already resolved, and rejected if it is not resolved at the time of calling `:now()`. This can be used to ensure your `andThen` handler occurs on the same frame as the root Promise execution.

```lua
doSomething()
    :now()
    :andThen(function(value)
        print("Got", value, "synchronously.")
    end)
```

If this Promise is still running, Rejected, or Cancelled, the Promise returned from `:now()` will reject with the `rejectionValue` if passed, otherwise with a `Promise.Error(Promise.Error.Kind.NotResolvedInTime)`. This can be checked with `Error.isKind`.
