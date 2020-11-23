const body = require('body/json')
const sendJson = require('send-data/json')

const Target = require('../models/target')

module.exports = {
  postTarget: postTarget,
  getTargets: getTargets,
  getSpecificTarget: getSpecificTarget,
  updateTarget: updateTarget,
  route: route
}

// handles POST /api/targets
function postTarget (req, res) {
  body(req, res, function (err, postData) {
    if (err) return onError(req, res, err)

    Target.addTarget(postData, function (err) {
      if (err) return onError(req, res, err)

      sendJson(req, res, { body: postData, statusCode: 200 })
    })
  })
}

// handles GET /api/targets
function getTargets (req, res) {
  Target.getAllTargets(function (err, targets) {
    if (err) return onError(req, res, err)

    sendJson(req, res, { body: targets, statusCode: 200 })
  })
}

// handles GET /api/target/:id
function getSpecificTarget (req, res, opts) {
  // extract target id from params
  const { params: { id: targetId } } = opts

  Target.getTargetById(targetId, function (err, target) {
    if (err) return onError(req, res, err)

    sendJson(req, res, { body: target, statusCode: 200 })
  })
}

// handles POST /api/target/:id
function updateTarget (req, res, opts) {
  const { params: { id: targetId } } = opts

  body(req, res, function (err, updatedField) {
    if (err) return onError(req, res, err)

    Target.updateTarget(targetId, updatedField, function (err) {
      if (err) return onError(req, res, err)

      sendJson(req, res, {
        body: { success: true },
        statusCode: 200
      })
    })
  })
}

// handles POST /route
function route (req, res) {
  body(req, res, function (err, reqBody) {
    if (err) return onError(req, res, err)

    // find all targets
    Target.getAllTargets(function (err, targets) {
      if (err) return onError(req, res, err)

      var { geoState, timestamp } = reqBody
      var timestampDateObj = new Date(timestamp)
      var today = new Date()

      var hour = timestampDateObj.getUTCHours().toString()
      var date = today.getUTCFullYear() +
      '-' + today.getUTCMonth() + '-' + today.getUTCDate()

      // filter targets with no accept or
      // accept less than maxAcceptsPerDay on current day
      targets = targets.filter(
        (target) => {
          if (!target['acceptCountOn' + date] ||
            (target['acceptCountOn' + date] &&
              parseInt(target['acceptCountOn' + date]) <
               parseInt(target.maxAcceptsPerDay))) {
            return target
          }
        })

      // get decision with targets and criterias
      var decision = decide(targets, { geoState, hour })
      // respond request with decision value
      respondDecision(req, res, { decision, date })
    })
  })
}

function decide (targets, criteria) {
  const { geoState, hour } = criteria

  var highestTargetValue = 0
  var resultTarget = null

  targets.forEach(function (target) {
    const {
      value: currentValue,
      accept: {
        geoState: { $in: geoAccept },
        hour: { $in: hourAccept }
      }
    } = target

    // target matches if geoAccept and hourAccept include criterias
    const targetMatches = geoAccept.includes(geoState) &&
    hourAccept.includes(hour)

    // highest value is set if current value is greater than
    // previous highest
    if (targetMatches && (currentValue > highestTargetValue)) {
      highestTargetValue = currentValue
      resultTarget = target
    }
  })

  if (resultTarget) return { result: resultTarget, isReject: false }

  return { result: { decision: 'reject' }, isReject: true }
}

// returns request with decision result
function respondDecision (req, res, opts) {
  const { decision, date } = opts
  // if reject, respond with reject decision
  if (decision.isReject) {
    return sendJson(req, res, {
      body: decision.result, statusCode: 200
    })
  }

  // else update the day's accept count of the target and
  // send the result url
  var resultTarget = decision.result
  var totalAcceptOnDate = resultTarget['acceptCountOn' + date]
    ? parseInt(resultTarget['acceptCountOn' + date])
    : 0

  // increase total accept count on date by one
  totalAcceptOnDate += 1
  Target.updateTarget(resultTarget.id,
    { ['acceptCountOn' + date]: totalAcceptOnDate },
    function (err, updatedTarget) {
      if (err) return onError(req, res, err)

      sendJson(req, res, {
        body: { url: resultTarget.url },
        statusCode: 200
      })
    })
}

function onError (req, res, err) {
  res.statusCode = err.statusCode || 500

  sendJson(req, res, {
    error: err.message || 'Problem handling request'
  })
}
