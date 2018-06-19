var mongoose = require('mongoose');

var callLogSchema = mongoose.Schema({
  fromNumber: String,
  toNumber: String,
  callDate: Date,
  tzOffset: Number,
  transformedCgpn: String,
  transformedCdpn: String
});

module.exports = mongoose.model('callLog', callLogSchema);
