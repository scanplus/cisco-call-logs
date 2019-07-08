var express = require('express');
var router = express.Router();
var dbConn = require('../database/mongo-connection.js');
var callLogModel = require('../database/CallLog-model.js');
var mongoose = require('mongoose');

var weekdays = new Array(8);
weekdays[0] = "";
weekdays[1] = "Montag";
weekdays[2] = "Dienstag";
weekdays[3] = "Mittwoch";
weekdays[4] = "Donnerstag";
weekdays[5] = "Freitag";
weekdays[6] = "Samstag";
weekdays[7] = "Sonntag";

function getDateOfISOWeek(w, y) {
  var simple = new Date(y, 0, 1 + (w - 1) * 7);
  var dow = simple.getDay();
  var ISOweekStart = simple;
  if(dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return { year: d.getUTCFullYear(), week: weekNo };
}

function getNextWeek(week) {
  let d = getDateOfISOWeek(week.week, week.year);
  d.setDate(d.getDate() + 7);
  return getWeekNumber(d);
}

function getPrevWeek(week) {
  let d = getDateOfISOWeek(week.week, week.year);
  d.setDate(d.getDate() - 7);
  return getWeekNumber(d);
}

router.get('/', function(req, res, next) {
  var weekNum = getWeekNumber(new Date());
  res.redirect('/perCalWeek/' + weekNum.year + '/' + weekNum.week);
});

router.get('/ext', function(req, res, next) {
  var weekNum = getWeekNumber(new Date());
  res.redirect('/perCalWeek/' + weekNum.year + '/' + weekNum.week + '/ext');
});

router.get('/int', function(req, res, next) {
  var weekNum = getWeekNumber(new Date());
  res.redirect('/perCalWeek/' + weekNum.year + '/' + weekNum.week + '/int');
});

function loadCalls(filter, week, callback) {
  var db = dbConn();
  queryFilter = {};
  if(filter === 'ext') {
    queryFilter = {
      fromNumber: { $regex: /\+.*/ }
    }
  } else if(filter === 'int') {
    queryFilter = {
      fromNumber: { $regex: /^\d\d\d|^\d\d\d\d/ }
    }
  }
  var weekStart = getDateOfISOWeek(week.week, week.year);
  var weekEnd = getDateOfISOWeek(week.week, week.year);
  weekEnd.setDate(weekEnd.getDate() + 7);
  queryFilter.callDate = {
    $lte: weekEnd,
    $gte: weekStart
  }

  db.once('open', function() {
    var query = callLogModel.aggregate([
      {
        $match: queryFilter
      }, {
        $project: {
          weekDay: { $isoDayOfWeek: "$callDate" }
        }
      }, {
        $group: {
          _id: "$weekDay",
          count: { $sum: 1 }
        }
      }, {
        $sort: {
          _id: 1
        }
      }
    ]);

    query.exec(function(err, queryResult) {
      if (err) console.log(err, null);
      callback(null, queryResult);
      db.close();
    });
  });
}

function checkParams(req, res, filter) {
  var year = parseInt(req.params.year);
  var week = parseInt(req.params.week);
  if(Number.isNaN(year) || Number.isNaN(week)) {
    var weekNum = getWeekNumber(new Date());
    res.redirect('/perCalWeek/' + weekNum.year + '/' + weekNum.week + '/' + filter);
  }
  return { year: year, week: week };
}

function buildRenderObject(session, queryResult, week, filter) {
  return {
    session: session,
    queryResult: queryResult,
    weekdays: weekdays,
    week: week,
    nWeek: getNextWeek(week),
    pWeek: getPrevWeek(week),
    filter: filter
  }
}

router.get('/:year/:week', function(req, res, next) {
  let week = checkParams(req, res, '');
  loadCalls('', week, function(err, queryResult) {
    let renderObject = buildRenderObject(req.session, queryResult, week, '');
    res.render('perCalWeek', renderObject);
  });
});

router.get('/:year/:week/ext', function(req, res, next) {
  let week = checkParams(req, res, 'ext');
  loadCalls('ext', week, function(err, queryResult) {
    let renderObject = buildRenderObject(req.session, queryResult, week, 'ext');
    res.render('perCalWeek', renderObject);
  });
});

router.get('/:year/:week/int', function(req, res, next) {
  let week = checkParams(req, res, 'int');
  loadCalls('int', week, function(err, queryResult) {
    let renderObject = buildRenderObject(req.session, queryResult, week, 'int');
    res.render('perCalWeek', renderObject);
  });
});

module.exports = router;
