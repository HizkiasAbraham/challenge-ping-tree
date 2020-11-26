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
  body(req, res, function (err, criterias) {
    if (err) return onError(req, res, err)

    criterias = processCriterias(criterias)
    // find all targets
    Target.getAllTargets(function (err, targets) {
      if (err) return onError(req, res, err)

      var date = (new Date()).toDateString()
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
      var decision = decide(targets, criterias)
      // respond request with decision value
      respondDecision(req, res, { decision, date })
    })
  })
}

// assuming that hour and week day are important for decision,
// if a criteria contains
// a field that is a timestamp string (matches tempstamp regex),
// we extract the hour and week day from it,
// then put on criterias

function processCriterias (criterias) {
  var processedCriteria = {}

  Object.keys(criterias).forEach(function (key) {
    if (
      criterias[key]
        .match(
          /\b[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z\b/
        )) {
      var timestampDateObj = new Date(criterias[key])
      processedCriteria.hour = timestampDateObj.getUTCHours().toString()
      processedCriteria.day = timestampDateObj.getDay().toString()
    } else {
      processedCriteria[key] = criterias[key]
    }
  })

  return processedCriteria
}

function decide (targets, criterias) {
  var highestTargetValue = 0
  var resultTarget = null

  targets.forEach(function (target) {
    const {
      value: currentValue,
      accept
    } = target

    var targetMatches = true
    // target matches if accept includes criterias else it will become false
    Object.keys(accept).forEach(function (key) {
      targetMatches &= accept[key].$in.includes(criterias[key])
    })

    // highest value is set if current value is greater than
    // previous highest
    if (targetMatches && (parseFloat(currentValue) > highestTargetValue)) {
      highestTargetValue = parseFloat(currentValue)
      resultTarget = target
    }
  })

  if (resultTarget) return { result: resultTarget, isReject: false }

  return { result: { decision: 'reject' }, isReject: true }
}

// returns request with decision result and
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
