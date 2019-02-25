var express = require('express');
var router = express.Router();
var _ = require('lodash');
var dbConn = require('../database/mongo-connection.js');
var callLogModel = require('../database/CallLog-model.js');
var mongoose = require('mongoose');


function loadCalls(fromNumber, toNumber, callback) {
  var db = dbConn();
  queryFilter = {};
  if(fromNumber !== '') {
    queryFilter = _.merge(queryFilter, {"fromNumber": fromNumber})
  }
  if(toNumber !== '') {
    queryFilter = _.merge(queryFilter, {"toNumber": toNumber})
  }
  db.once('open', function() {
    var query = callLogModel.find(queryFilter).sort({callDate: -1});

    query.exec(function(err, queryResult) {
      if (err) callback(err, null);
      callback(null, queryResult);
    });
  });
}

router.get('/', function(req, res, next) {
  res.render('search', { session: req.session });
});

router.post('/', function(req, res, next) {

  let fromNumber = _.trim(req.body.fromNumber);
  let toNumber = _.trim(req.body.toNumber);

  loadCalls(fromNumber, toNumber, function(err, queryResult) {
    if (err) console.log(err);
    res.render('search', { session: req.session, queryResult: queryResult, fromNumber: fromNumber, toNumber: toNumber });
  });
});

module.exports = router;
