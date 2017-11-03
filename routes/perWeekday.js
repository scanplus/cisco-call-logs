var express = require('express');
var router = express.Router();
var dbConn = require('../database/mongo-connection.js');
var callLogModel = require('../database/CallLog-model.js');
var mongoose = require('mongoose');

var weekdays = new Array(7);
weekdays[0] = "Sunday";
weekdays[1] = "Monday";
weekdays[2] = "Tuesday";
weekdays[3] = "Wednesday";
weekdays[4] = "Thursday";
weekdays[5] = "Friday";
weekdays[6] = "Saturday";

/* GET home page. */
router.get('/', function(req, res, next) {
  var db = dbConn();
  db.once('open', function() {
    var CallLog = callLogModel(mongoose, db);
    var query = CallLog.aggregate([
      {
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
      res.render('perWeekday', { queryResult: queryResult, weekdays: weekdays });
    });
  });
});

module.exports = router;
