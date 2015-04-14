
var assert = require('assert')
var async = require('async')
var rememoize = require('../lib/rememoize')

describe('rememoize', function() {
  it('should return initialValue immediately if given', function(done) {
    this.timeout(500)
    var expected = 'foo1'
    var myFunc = function(cb) {
      setTimeout(function() {
        cb(null, 'foo2')
      }, 10000)
    }
    var memoizedFunc = rememoize(myFunc, {
      initialValue: 'foo1'
    })
    memoizedFunc(function(err, value) {
      assert.ok(!err)
      assert.equal(value, expected)
      done()
    })
  })
  it('should queue up calls while refreshing initially', function(done) {
    var expected = 'foo1'
    var myFunc = function(cb) {
      setTimeout(function() {
        cb(null, 'foo1')
      }, 1000)
    }
    var memoizedFunc = rememoize(myFunc)
    async.parallel([
      memoizedFunc,
      memoizedFunc,
      memoizedFunc
    ], function(err, results) {
      assert.ok(!err)
      results.forEach(function(value) {
        assert.equal(value, expected)
      })
      done()
    })
  })
  it('should satisfy all queued up calls with same error if an error occurs', function(done) {
    var myFunc = function(cb) {
      setTimeout(function() {
        cb(new Error('oh noes'))
      }, 1000)
    }
    var memoizedFunc = rememoize(myFunc)
    async.parallel([
      function(next) {
        memoizedFunc(function(err) {
          assert.ok(err)
          next()
        })
      },
      function(next) {
        memoizedFunc(function(err) {
          assert.ok(err)
          next()
        })
      }
    ], done)
  })
  it('should auto-refresh', function(done) {
    var expectedFirst = 'foo1'
    var expectedSecond = 'foo2'
    var isFirstRun = true
    var myFunc = function(cb) {
      setTimeout(function() {
        if (isFirstRun) {
          isFirstRun = false
          return cb(null, 'foo1')
        }
        cb(null, 'foo2')
      }, 200)
    }
    var memoizedFunc = rememoize(myFunc, {
      refreshInterval: 100
    })
    memoizedFunc(function(err, value) {
      assert.ok(!err)
      assert.equal(value, expectedFirst)
      setTimeout(function() {
        memoizedFunc(function(err, value) {
          assert.ok(!err)
          assert.equal(value, expectedSecond)
          done()
        })
      }, 1000)
    })
  })
  it('should pass last error to callback when an error occurs during refresh, as long as no value is available', function(done) {
    var expectedValue = 'foo1'
    var isFirstRun = true
    var myFunc = function(cb) {
      setTimeout(function() {
        if (isFirstRun) {
          isFirstRun = false
          return cb(null, 'foo1')
        }
        cb(new Error('oh noes'))
      }, 200)
    }
    var memoizedFunc = rememoize(myFunc, {
      refreshInterval: 100
    })
    memoizedFunc(function(err, value) {
      assert.ok(!err)
      assert.equal(value, expectedValue)
      setTimeout(function() {
        memoizedFunc(function(err, value) {
          assert.ok(err)
          setTimeout(function() {
            memoizedFunc(function(err, value) {
              assert.ok(err)
              done()
            })
          }, 1000)
        })
      }, 1000)
    })
  })
  it('should pass last error to callback when an error occurs during refresh', function(done) {
    var expectedValue = 'foo1'
    var isFirstRun = true
    var myFunc = function(cb) {
      setTimeout(function() {
        if (isFirstRun) {
          isFirstRun = false
          return cb(null, 'foo1')
        }
        cb(new Error('oh noes'))
      }, 200)
    }
    var memoizedFunc = rememoize(myFunc, {
      refreshInterval: 100
    })
    memoizedFunc(function(err, value) {
      assert.ok(!err)
      assert.equal(value, expectedValue)
      setTimeout(function() {
        memoizedFunc(function(err, value) {
          assert.ok(err)
          done()
        })
      }, 1000)
    })
  })
  it('should call given async func on first call to rememoized func', function(done) {
    var wasCalled = false
    var myFunc = function(cb) {
      wasCalled = true
      cb()
    }
    var memoizedFunc = rememoize(myFunc, {})
    assert.equal(wasCalled, false)
    memoizedFunc(function(err, value) {
      assert.equal(wasCalled, true)
      done()
    })
  })
  it('should call given async again if error returned from first iteration', function(done) {
    var callCount = 0
    var myFunc = function(cb) {
      callCount++
      cb(new Error('oh noes ' + callCount))
    }
    var memoizedFunc = rememoize(myFunc, {})
    memoizedFunc(function(err, value) {
      assert.ok(err)
      assert.equal(err.message, 'oh noes 1')
      assert.equal(callCount, 1)
      memoizedFunc(function(err, value) {
        assert.ok(err)
        assert.equal(callCount, 2)
        assert.equal(err.message, 'oh noes 2')
        done()
      })
    })
  })
})
