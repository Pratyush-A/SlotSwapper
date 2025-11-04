const mongoose = require('mongoose');

const swapSchema = new mongoose.Schema({
  mySlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  theirSlot: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  status: { type: String, enum: ['PENDING','ACCEPTED','REJECTED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('SwapRequest', swapSchema);
