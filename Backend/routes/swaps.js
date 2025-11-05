const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Event = require("../models/Event");
const SwapRequest = require("../models/SwapRequest");
const mongoose = require("mongoose");


router.get("/swappable-slots", auth, async (req, res) => {
  try {
    const slots = await Event.find({
      status: "SWAPPABLE",
      owner: { $ne: req.user._id },
    })
      .populate("owner", "name email")
      .sort({ startTime: 1 });

    res.json(slots);
  } catch (err) {
    console.error("Error fetching swappable slots:", err);
    res.status(500).json({ error: "Server error fetching swappable slots" });
  }
});

router.post("/swap-request", auth, async (req, res) => {
  const { mySlotId, theirSlotId } = req.body;

  if (!mySlotId || !theirSlotId)
    return res.status(400).json({ error: "Missing slot IDs" });

  try {
    const [mySlot, theirSlot] = await Promise.all([
      Event.findById(mySlotId),
      Event.findById(theirSlotId),
    ]);

    if (!mySlot || !theirSlot)
      return res.status(404).json({ error: "Slot(s) not found" });

    if (String(mySlot.owner) !== String(req.user._id))
      return res.status(403).json({ error: "You do not own mySlot" });

    if (String(theirSlot.owner) === String(req.user._id))
      return res.status(400).json({ error: "Cannot swap with your own slot" });

    if (mySlot.status !== "SWAPPABLE" || theirSlot.status !== "SWAPPABLE")
      return res.status(400).json({ error: "Both slots must be swappable" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const swap = await SwapRequest.create(
        [
          {
            mySlot: mySlot._id,
            theirSlot: theirSlot._id,
            requester: req.user._id,
            responder: theirSlot.owner,
            status: "PENDING",
          },
        ],
        { session }
      );

      mySlot.status = "SWAP_PENDING";
      theirSlot.status = "SWAP_PENDING";
      await Promise.all([mySlot.save({ session }), theirSlot.save({ session })]);

      await session.commitTransaction();
      session.endSession();

      const populated = await SwapRequest.findById(swap[0]._id)
        .populate("mySlot theirSlot requester responder");

      res.json(populated);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Swap creation error:", err);
      res.status(500).json({ error: "Failed to create swap request" });
    }
  } catch (err) {
    console.error("Error handling swap-request:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.post("/swap-response/:requestId", auth, async (req, res) => {
  const { requestId } = req.params;
  const { accept } = req.body;

  try {
    const swap = await SwapRequest.findById(requestId).populate(
      "mySlot theirSlot"
    );

    if (!swap) return res.status(404).json({ error: "Swap request not found" });

    if (String(swap.responder) !== String(req.user._id))
      return res.status(403).json({ error: "Not authorized to act on this swap" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const mySlot = await Event.findById(swap.mySlot._id).session(session);
      const theirSlot = await Event.findById(swap.theirSlot._id).session(session);

      if (!mySlot || !theirSlot) throw new Error("One or both slots missing");

      if (accept) {
   
        const tempOwner = mySlot.owner;
        mySlot.owner = theirSlot.owner;
        theirSlot.owner = tempOwner;

        mySlot.status = "BUSY";
        theirSlot.status = "BUSY";
      } else {
        
        mySlot.status = "SWAPPABLE";
        theirSlot.status = "SWAPPABLE";
      }

      await Promise.all([
        mySlot.save({ session }),
        theirSlot.save({ session }),
        SwapRequest.deleteOne({ _id: swap._id }).session(session),
      ]);

      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: accept ? "Swap accepted" : "Swap rejected",
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Swap response transaction error:", err);
      res.status(500).json({ error: "Transaction failed" });
    }
  } catch (err) {
    console.error("Swap response outer error:", err);
    res.status(500).json({ error: "Server error responding to swap" });
  }
});


router.get("/swap-requests", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const incoming = await SwapRequest.find({
      responder: userId,
      status: "PENDING",
    })
      .populate("mySlot theirSlot requester responder")
      .sort({ createdAt: -1 });

    const outgoing = await SwapRequest.find({
      requester: userId,
      status: "PENDING",
    })
      .populate("mySlot theirSlot requester responder")
      .sort({ createdAt: -1 });

    res.json({ incoming, outgoing });
  } catch (err) {
    console.error("Error fetching swap requests:", err);
    res.status(500).json({ error: "Server error fetching swap requests" });
  }
});

module.exports = router;
