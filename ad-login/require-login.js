let _ = require('lodash');
let excludedPaths = new Array();

excludedPaths.push('/favicon.ico');

function needToSetPrevPath(prevPath) {
  return !_.includes(excludedPaths, prevPath);
}

module.exports = function requiresLogin(req, res, next) {
  if(req.session && req.session.authenticated) {
    return next();
  } else {
    if(needToSetPrevPath(req.path)) {
      req.session.prevPath = req.path;
    }
    return res.redirect('/login');
  }
}
