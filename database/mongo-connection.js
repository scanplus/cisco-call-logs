var mongoose = require('mongoose');
var _ = require('lodash');

module.exports = function() {
  var mongoconnection = null;
  if(typeof process.env.MONGO_HOST === 'string' &&
     typeof process.env.MONGO_DB === 'string') {

    var mongoHost = _.trim(process.env.MONGO_HOST);
    var mongoDb = _.trim(process.env.MONGO_DB);

    mongoose.Promise = global.Promise;

    var connectionString = "";
    if(typeof process.env.MONGO_USER === 'string' &&
       typeof process.env.MONGO_PASS === 'string') {
      var mongoUser = _.trim(process.env.MONGO_USER);
      var mongoPass = _.trim(process.env.MONGO_PASS);
      connectionString = 'mongodb://' + mongoUser + ':' +
      mongoPass + '@' + mongoHost + '/' + mongoDb;
    } else {
      connectionString = 'mongodb://' + mongoHost + '/' + mongoDb;
    }

    mongoconnection = mongoose.createConnection(connectionString);
    mongoconnection.on('error', console.error.bind(console, 'connection error:'));
  }
  return mongoconnection;
}
