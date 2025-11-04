const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['BUSY','SWAPPABLE','SWAP_PENDING'], default: 'BUSY' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

eventSchema.index({ status: 1, startTime: 1 });

module.exports = mongoose.model('Event', eventSchema);
