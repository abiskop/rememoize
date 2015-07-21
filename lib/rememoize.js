
module.exports = function(asyncFn, options) {
  options = options || {}
  var refreshInterval = parseInt(options.refreshInterval, 10) || undefined
  var autoRefresh = refreshInterval && (refreshInterval > 0)
  var hasInitialValue = options.initialValue !== undefined
  var cachedValue = options.initialValue
  var initialCallsQueue = []
  var lastError = null
  var isFirstCall = true
  var waitingForFirstCompletion = true
  var errorOccuredOnVeryFirstCall = false
  if (autoRefresh) {
    setInterval(refresh, refreshInterval)
  }
  return memoizedFn

  function memoizedFn(cb) {
    if (isFirstCall || errorOccuredOnVeryFirstCall) {
      isFirstCall = false
      refresh()
    }
    if (waitingForFirstCompletion) {
      if (hasInitialValue) {
        cb(null, cachedValue)
        return
      }
      initialCallsQueue.push(cb)
      return
    }
    if (lastError) {
      var error = lastError
      if (cachedValue) {
        lastError = null
      }
      return cb(error)
    }
    cb(null, cachedValue)
  }

  function refresh() {
    asyncFn(function(err, value) {
      lastError = err || null
      if (!err) {
        cachedValue = value
        errorOccuredOnVeryFirstCall = false
      } else {
        errorOccuredOnVeryFirstCall = true
      }
      if (waitingForFirstCompletion) {
        waitingForFirstCompletion = false
        var callsToSatisfy = initialCallsQueue.slice()
        initialCallsQueue = []
        callsToSatisfy.forEach(function(callback) {
          callback(err, err ? undefined : cachedValue)
        })
        return
      }
    })
  }
}
