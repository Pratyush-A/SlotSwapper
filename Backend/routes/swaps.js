const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Event = require("../models/Event");
const SwapRequest = require("../models/SwapRequest");


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
      return res.status(403).json({ error: "You do not own this slot" });

    if (String(theirSlot.owner) === String(req.user._id))
      return res.status(400).json({ error: "Cannot swap with your own slot" });

    if (mySlot.status !== "SWAPPABLE")
      return res.status(400).json({ error: "Your slot must be swappable" });

   
    mySlot.status = "SWAP_PENDING";
    await mySlot.save();

    const swap = await SwapRequest.create({
      mySlot: mySlot._id,
      theirSlot: theirSlot._id,
      requester: req.user._id,
      responder: theirSlot.owner,
      status: "PENDING",
    });

    const populated = await swap.populate([
      { path: "mySlot" },
      { path: "theirSlot" },
      { path: "requester", select: "name email" },
      { path: "responder", select: "name email" },
    ]);

    req.io.emit("swapUpdated", { message: "New swap request created" });
    res.json(populated);
  } catch (err) {
    console.error("Swap request error:", err);
    res.status(500).json({ error: "Server error creating swap request" });
  }
});


router.post("/swap-response/:requestId", auth, async (req, res) => {
  const { requestId } = req.params;
  const { accept } = req.body;

  try {
    const swap = await SwapRequest.findById(requestId)
      .populate("mySlot theirSlot requester responder");

    if (!swap)
      return res.status(404).json({ error: "Swap request not found" });

    if (String(swap.responder._id) !== String(req.user._id))
      return res.status(403).json({ error: "Not authorized" });


    if (accept) {
      const tempOwner = swap.mySlot.owner;
      swap.mySlot.owner = swap.theirSlot.owner;
      swap.theirSlot.owner = tempOwner;

      swap.mySlot.status = "BUSY";
      swap.theirSlot.status = "BUSY";
      await Promise.all([swap.mySlot.save(), swap.theirSlot.save()]);

      
      const otherSwaps = await SwapRequest.find({
        _id: { $ne: swap._id },
        $or: [
          { theirSlot: swap.theirSlot._id },
          { mySlot: swap.theirSlot._id },
        ],
        status: "PENDING",
      }).populate("mySlot");

      
      for (const s of otherSwaps) {
        if (s.mySlot) {
          s.mySlot.status = "SWAPPABLE";
          await s.mySlot.save();
        }
        await SwapRequest.deleteOne({ _id: s._id });
      }
    } else {
      
      swap.mySlot.status = "SWAPPABLE";
      await swap.mySlot.save();
    }

    await SwapRequest.deleteOne({ _id: swap._id });

    req.io.emit("swapUpdated", { message: "Swap request resolved" });

    res.json({
      success: true,
      message: accept ? "Swap accepted successfully" : "Swap rejected",
    });
  } catch (err) {
    console.error("Swap response error:", err);
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
