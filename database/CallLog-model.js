module.exports = function(mongoose, db) {
  var callLogSchema = mongoose.Schema({
    fromNumber: String,
    toNumber: String,
    callDate: Date,
    transformedCgpn: String,
    transformedCdpn: String
  });
  return db.model('callLog', callLogSchema);
}
