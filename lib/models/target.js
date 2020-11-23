var redis = require('../redis')

var TARGET_MODEL_KEY = 'TARGET_MODEL_KEY'

module.exports = {
  addTarget: addTarget,
  updateTarget: updateTarget,
  getTargetById: getTargetById,
  getAllTargets: getAllTargets
}

// adds a new target
function addTarget (targetData, cb) {
  redis.hset(TARGET_MODEL_KEY, targetData.id,
    JSON.stringify(targetData), function (err) {
      cb(err)
    })
}

// updates an existing target by target id
function updateTarget (targetId, updatedField, cb) {
  // finds target by targetid
  getTargetById(targetId, function (err, target) {
    if (err) return cb(err)
    // assigns the value of updated on target
    Object.keys(updatedField).forEach((key) => {
      target[key] = updatedField[key]
    })
    // stores the updated target
    redis.hset(TARGET_MODEL_KEY, targetId,
      JSON.stringify(target), function (err) {
        cb(err)
      })
  })
}

// finds a target by its id
function getTargetById (targetId, cb) {
  redis.hget(TARGET_MODEL_KEY, targetId, function (err, targetFound) {
    if (err) return cb(err)

    const target = JSON.parse(targetFound)
    cb(err, target)
  })
}

// gets all available targets
function getAllTargets (cb) {
  redis.hgetall(TARGET_MODEL_KEY, function (err, targetsFound) {
    if (err) return cb(err)
    var allTargets = []
    if (targetsFound) {
      const targets = Object.values(targetsFound)
      allTargets = targets.map(targetString => JSON.parse(targetString))
    }

    cb(err, allTargets)
  })
}
