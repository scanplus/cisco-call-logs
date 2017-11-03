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
    var query = CallLog.find().sort({callDate: -1}).limit(20);
    query.exec(function(err, queryResult) {
      if (err) console.log(err);
      console.log(queryResult);
      res.render('index', { queryResult: queryResult });
    });
  });
});

module.exports = router;
