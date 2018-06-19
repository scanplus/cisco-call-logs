var express = require('express');
var router = express.Router();
var dbConn = require('../database/mongo-connection.js');
var callLogModel = require('../database/CallLog-model.js');
var mongoose = require('mongoose');
var numeral = require('numeral');

function loadCalls(filter, callback) {
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
  db.once('open', function() {
    var query = callLogModel.aggregate([
      {
        $match: queryFilter
      }, {
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
      if (err) console.log(err, null);
      callback(null, queryResult);
    });
  });
}


router.get('/', function(req, res, next) {
  loadCalls('', function(err, queryResult) {
    res.render('perHour', { session: req.session, queryResult: queryResult, numeral: numeral });
  });
});

router.get('/ext', function(req, res, next) {
  loadCalls('ext', function(err, queryResult) {
    res.render('perHour', { session: req.session, queryResult: queryResult, numeral: numeral });
  });
});

router.get('/int', function(req, res, next) {
  loadCalls('int', function(err, queryResult) {
    res.render('perHour', { session: req.session, queryResult: queryResult, numeral: numeral });
  });
});

module.exports = router;
