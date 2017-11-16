module.exports = function requiresLogin(req, res, next) {
  if(req.session && req.session.authenticated) {
    return next();
  } else {
    req.session.prevPath = req.path;
    return res.redirect('/login');
  }
}
