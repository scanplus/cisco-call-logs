var mongoose = require('mongoose');
var _ = require('lodash');

module.exports = function() {
  var mongoconnection = null;
  if(typeof process.env.MONGO_HOST === 'string' &&
     typeof process.env.MONGO_DB === 'string') {

    var mongoHost = _.trim(process.env.MONGO_HOST);
    var mongoDb = _.trim(process.env.MONGO_DB);

    mongoose.Promise = global.Promise;

    var connectionOptions = {};
    var connectionString = 'mongodb://' + mongoHost + '/' + mongoDb;
    if(typeof process.env.MONGO_USER === 'string' &&
       typeof process.env.MONGO_PASS === 'string') {
      connectionOptions.user = _.trim(process.env.MONGO_USER);
      connectionOptions.pass = _.trim(process.env.MONGO_PASS);
    }

    mongoose.connect(connectionString, connectionOptions);
    mongoconnection = mongoose.connection;
    mongoconnection.on('error', console.error.bind(console, 'connection error:'));
  }
  return mongoconnection;
}
