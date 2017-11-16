var express = require('express');
var router = express.Router();
var _ = require('lodash');
var login = require('../ad-login/ad-login.js');

router.get('/', function(req, res, next) {
  res.render('login');
});

router.post('/', function(req, res, next) {
  
  let state = {
    success: false,
    errMessage: "",
    errField: ""
  };
   
  let username = _.trim(req.body.username);
  let password = _.trim(req.body.password);

  if(_.isEmpty(username)) {
    state.errField = 'username';
    state.errMessage = 'Bitte Benutzernamen angeben';
    res.render('login', { state: state });
    return;
  }
  if(_.isEmpty(password)) {
    state.errField = 'password';
    state.errMessage = 'Bitte Password angeben';
    res.render('login', { state: state });
    return;
  }

  login(username, password, function(err, loginRes) {
    if(err) {
      console.log(err);
      state.errMessage = err;
      res.render('login', { state: state });
      return;
    }
    if(!loginRes) {
      state.errMessage = 'Benutzername oder Passwort falsch';
      res.render('login', { state: state });
    } else {
      req.session.authenticated = true;
      res.redirect('/');
    }
  });
});

module.exports = router;
