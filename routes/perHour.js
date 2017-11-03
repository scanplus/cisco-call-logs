var express = require('express');
var router = express.Router();
var dbConn = require('../database/mongo-connection.js');
var callLogModel = require('../database/CallLog-model.js');
var mongoose = require('mongoose');
var numeral = require('numeral');

/* GET home page. */
router.get('/', function(req, res, next) {
  var db = dbConn();
  db.once('open', function() {
    var CallLog = callLogModel(mongoose, db);
    var query = CallLog.aggregate([
      {
        $project: {
          hour: {$hour: "$callDate"}
        }
      }, {
        $group: {
          _id: "$hour" ,
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
      res.render('perHour', { queryResult: queryResult, numeral: numeral });
    });
  });
});

module.exports = router;
