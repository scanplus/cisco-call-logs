var express = require('express');
var router = express.Router();
var dbConn = require('../database/mongo-connection.js');
var callLogModel = require('../database/CallLog-model.js');
var mongoose = require('mongoose');


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
    var CallLog = callLogModel(mongoose, db);
    var query = CallLog.find(queryFilter).sort({callDate: -1}).limit(20);

    query.exec(function(err, queryResult) {
      if (err) callback(err, null);
      callback(null, queryResult);
    });
  });
}

router.get('/', function(req, res, next) {
  loadCalls('', function(err, queryResult) {
    if (err) console.log(err);
    res.render('index', { queryResult: queryResult });
  });
});

router.get('/ext', function(req, res, next) {
  loadCalls('ext', function(err, queryResult) {
    if (err) console.log(err);
    res.render('index', { queryResult: queryResult });
  });
});

router.get('/int', function(req, res, next) {
  loadCalls('int', function(err, queryResult) {
    if (err) console.log(err);
    res.render('index', { queryResult: queryResult });
  });
});

module.exports = router;
