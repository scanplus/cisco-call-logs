module.exports = function(mongoose, db) {
  var callLogSchema = mongoose.Schema({
    fromNumber: String,
    toNumber: String,
    callDate: Date,
    tzOffset: Number,
    transformedCgpn: String,
    transformedCdpn: String
  });
  return db.model('callLog', callLogSchema);
}
