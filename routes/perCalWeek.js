var express = require('express');
var router = express.Router();
var dbConn = require('../database/mongo-connection.js');
var callLogModel = require('../database/CallLog-model.js');
var mongoose = require('mongoose');

var weekdays = new Array(7);
weekdays[0] = "Sonntag";
weekdays[1] = "Montag";
weekdays[2] = "Dienstag";
weekdays[3] = "Mittwoch";
weekdays[4] = "Donnerstag";
weekdays[5] = "Freitag";
weekdays[6] = "Samstag";

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
    return [d.getUTCFullYear(), weekNo];
}

router.get('/', function(req, res, next) {
  var weekNum = getWeekNumber(new Date());
  res.redirect('/perCalWeek/' + weekNum[0] + '/' + weekNum[1]);
});

router.get('/:year/:week', function(req, res, next) {
  var db = dbConn();

  var year = parseInt(req.params.year);
  var week = parseInt(req.params.week);
  if(Number.isNaN(year) || Number.isNaN(week)) {
    var weekNum = getWeekNumber(new Date());
    res.redirect('/perCalWeek/' + weekNum[0] + '/' + weekNum[1]);
  }

  db.once('open', function() {
    var CallLog = callLogModel(mongoose, db);

    var weekStart = getDateOfISOWeek(week, year);
    var weekEnd = getDateOfISOWeek(week, year);
    weekEnd.setDate(weekEnd.getDate() + 7);
    var query = CallLog.aggregate([
      {
        $match: {
          callDate: {
            $lte: weekEnd,
            $gte: weekStart
          }
        }
      }, {
        $project: {
          weekDay: {$dayOfWeek: "$callDate"}
        }
      }, {
        $group: {
          _id: "$weekDay" ,
          count: { $sum: 1 }
        }
      }, {
        $sort: {
          _id: 1
        }
      }
    ]);

    query.exec(function(err, queryResult) {
      if (err) console.log(err);
      res.render('perCalWeek', { queryResult: queryResult, weekdays: weekdays, week: week, year: year });
    });
  });
});

module.exports = router;
