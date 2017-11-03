module.exports = function(mongoose, db) {
  var callLogSchema = mongoose.Schema({
    fromNumber: String,
    toNumber: String,
    callDate: Date
  });
  return db.model('callLog', callLogSchema);
}
