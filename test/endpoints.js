process.env.NODE_ENV = 'test'

var test = require('ava')
var servertest = require('servertest')
var mapLimit = require('map-limit')

var server = require('../lib/server')
var mockTargets = require('../lib/targets-mock-data/targets')

test.serial.cb('healthcheck', function (t) {
  var url = '/health'
  servertest(server(), url, { encoding: 'json' }, function (err, res) {
    t.falsy(err, 'no error')

    t.is(res.statusCode, 200, 'correct statusCode')
    t.is(res.body.status, 'OK', 'status is ok')
    t.end()
  })
})

test.serial.cb('add target POST /api/targets', function (t) {
  var url = '/api/targets'
  mapLimit(mockTargets, 1, addTarget, function (err) {
    t.falsy(err, 'no error')
    t.end()
  })

  function addTarget (target, cb) {
    var opts = { encoding: 'json', method: 'POST' }
    var stream = servertest(server(), url, opts, function (err, res) {
      t.is(res.statusCode, 200)
      cb(err)
    })
    stream.end(JSON.stringify(target))
  }
})

test.serial.cb('get targets GET /api/targets', function (t) {
  var url = '/api/targets'
  servertest(server(), url, {
    encoding: 'json', method: 'GET'
  }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct status code')
    t.deepEqual(res.body, mockTargets, 'no targets')
    t.end()
  })
})

test.serial.cb('get target by id GET /api/target/:id', function (t) {
  var url = '/api/target/1'
  servertest(server(), url, {
    encoding: 'json', method: 'GET'
  }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct status code')
    t.deepEqual(res.body, mockTargets[0], 'correct target')
    t.end()
  })
})

test.serial.cb('post target by id POST /api/target/:id', function (t) {
  var url = '/api/target/2'
  var stream = servertest(server(), url, {
    encoding: 'json', method: 'POST'
  }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct status code')
    t.deepEqual(res.body, { success: true }, 'target updated')
    t.end()
  })
  stream.end(JSON.stringify({ url: 'http://google.com' }))
})

test.serial.cb('should route POST /route', function (t) {
  var url = '/route'
  var requestInfo = {
    geoState: 'ca',
    publisher: 'acb',
    timestamp: '2018-07-19T15:28:59.513Z'
  }

  var expected = { url: 'http://example.com' }
  var stream = servertest(server(), url, {
    encoding: 'json', method: 'POST'
  }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct code')
    t.deepEqual(res.body, expected, 'correct result')
    t.end()
  })

  stream.end(JSON.stringify(requestInfo))
})

test.serial.cb('should reject POST /route', function (t) {
  var url = '/route'
  var requestInfo = {
    geoState: 'la',
    publisher: 'abc',
    timestamp: '2018-07-19T23:28:59.513Z'
  }
  var expected = { decision: 'reject' }

  var stream = servertest(server(), url, {
    encoding: 'json', method: 'POST'
  }, function (err, res) {
    t.falsy(err, 'no error')
    t.is(res.statusCode, 200, 'correct code')
    t.deepEqual(res.body, expected, 'correct result')
    t.end()
  })
  stream.end(JSON.stringify(requestInfo))
})
