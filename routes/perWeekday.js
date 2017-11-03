var express = require('express');
var router = express.Router();
var dbConn = require('../database/mongo-connection.js');
var callLogModel = require('../database/CallLog-model.js');
var mongoose = require('mongoose');

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
      }
    ]);

    query.exec(function(err, queryResult) {
      if (err) console.log(err);
      res.render('perHour', { queryResult: queryResult });
    });
  });
});

module.exports = router;
