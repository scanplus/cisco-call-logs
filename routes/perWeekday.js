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
      res.render('perWeekday', { session: req.session, queryResult: queryResult, weekdays: weekdays });
    });
  });
});

module.exports = router;
