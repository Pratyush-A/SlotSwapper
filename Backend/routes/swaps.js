const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');
const SwapRequest = require('../models/SwapRequest');
const mongoose = require('mongoose');

router.get('/swappable-slots', auth, async (req, res) => {
  const slots = await Event.find({ status: 'SWAPPABLE', owner: { $ne: req.user._id } })
    .populate('owner', 'name email')
    .sort({ startTime: 1 });
  res.json(slots);
});


router.post('/swap-request', auth, async (req, res) => {
  const { mySlotId, theirSlotId } = req.body;
  if (!mySlotId || !theirSlotId) return res.status(400).json({ error: 'Missing slot ids' });


  const [mySlot, theirSlot] = await Promise.all([
    Event.findById(mySlotId),
    Event.findById(theirSlotId)
  ]);
  if (!mySlot || !theirSlot) return res.status(404).json({ error: 'Slot(s) not found' });


  if (String(mySlot.owner) !== String(req.user._id)) return res.status(403).json({ error: 'You do not own mySlot' });
  if (String(theirSlot.owner) === String(req.user._id)) return res.status(400).json({ error: 'theirSlot must belong to another user' });


  if (mySlot.status !== 'SWAPPABLE' || theirSlot.status !== 'SWAPPABLE') {
    return res.status(400).json({ error: 'One or both slots are not swappable' });
  }


  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const swap = await SwapRequest.create([{
      mySlot: mySlot._id,
      theirSlot: theirSlot._id,
      requester: req.user._id,
      responder: theirSlot.owner,
      status: 'PENDING'
    }], { session });

    mySlot.status = 'SWAP_PENDING';
    theirSlot.status = 'SWAP_PENDING';
    await mySlot.save({ session });
    await theirSlot.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await SwapRequest.findById(swap[0]._id).populate('mySlot theirSlot requester responder');
    res.json(populated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ error: 'Failed to create swap request' });
  }
});


router.post('/swap-response/:requestId', auth, async (req, res) => {
  const { requestId } = req.params;
  const { accept } = req.body;

  const swap = await SwapRequest.findById(requestId).populate('mySlot theirSlot');
  if (!swap) return res.status(404).json({ error: 'Swap request not found' });
  if (String(swap.responder) !== String(req.user._id)) return res.status(403).json({ error: 'Not allowed' });
  if (swap.status !== 'PENDING') return res.status(400).json({ error: 'Request already handled' });

  if (!accept) {

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      swap.status = 'REJECTED';
      await swap.save({ session });

      const [mySlot, theirSlot] = await Promise.all([
        Event.findById(swap.mySlot._id).session(session),
        Event.findById(swap.theirSlot._id).session(session)
      ]);

      if (mySlot.status === 'SWAP_PENDING') mySlot.status = 'SWAPPABLE';
      if (theirSlot.status === 'SWAP_PENDING') theirSlot.status = 'SWAPPABLE';
      await mySlot.save({ session });
      await theirSlot.save({ session });

      await session.commitTransaction();
      session.endSession();
      return res.json({ success: true, swap });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error(err);
      return res.status(500).json({ error: 'Failed to reject' });
    }
  } else {

    const session = await mongoose.startSession();
    session.startTransaction();
    try {

      const mySlot = await Event.findById(swap.mySlot._id).session(session);
      const theirSlot = await Event.findById(swap.theirSlot._id).session(session);


      if (!mySlot || !theirSlot) throw new Error('slots missing');
      if (mySlot.status !== 'SWAP_PENDING' || theirSlot.status !== 'SWAP_PENDING') {
        throw new Error('slots not pending');
      }


      const ownerA = mySlot.owner;
      const ownerB = theirSlot.owner;
      mySlot.owner = ownerB;
      theirSlot.owner = ownerA;


      mySlot.status = 'BUSY';
      theirSlot.status = 'BUSY';

      swap.status = 'ACCEPTED';
      await mySlot.save({ session });
      await theirSlot.save({ session });
      await swap.save({ session });

      await session.commitTransaction();
      session.endSession();

      const populated = await SwapRequest.findById(swap._id).populate('mySlot theirSlot requester responder');
      return res.json({ success: true, swap: populated });

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error(err);
      return res.status(500).json({ error: 'Failed to accept swap', details: err.message });
    }
  }
});

module.exports = router;
