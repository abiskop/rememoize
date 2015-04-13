
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
    var expectedFirst = 1
    var expectedSecond = 2
    var myFunc = function(cb) {
      var i = 0
      setTimeout(function() {
        i++
        cb(null, i)
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
})