var express = require('express');
var router = express.Router();
var _ = require('lodash');
var login = require('../ad-login/ad-login.js');

router.get('/', function(req, res, next) {
  req.session.destroy(function(err) {
    res.redirect('/login');
  });
});

module.exports = router;
