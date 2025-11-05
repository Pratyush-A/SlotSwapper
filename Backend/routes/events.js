const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Event = require("../models/Event");

router.post("/", auth, async (req, res) => {
  try {
    const { title, startTime, endTime } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    
    const conflict = await Event.findOne({
      startTime: { $lt: end },
      endTime: { $gt: start },
    }).populate("owner", "name email");

    if (conflict) {
      
      const nextAvailable = new Date(conflict.endTime);
      const conflictMessage = `⛔ This slot is already booked by ${
        conflict.owner?.name || "another user"
      } for "${conflict.title}" 
from ${new Date(conflict.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} to ${new Date(conflict.endTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}. 
Next available slot starts after ${nextAvailable.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}.`;

      return res.status(409).json({
        error: conflictMessage,
        conflict: {
          title: conflict.title,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          owner: conflict.owner,
          nextAvailable,
        },
      });
    }

    const newEvent = await Event.create({
      title,
      startTime,
      endTime,
      owner: req.user._id,
      status: "BUSY",
    });

    res.json(newEvent);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ error: "Server error creating event" });
  }
});


router.get("/me", auth, async (req, res) => {
  try {
    const events = await Event.find({ owner: req.user._id }).sort({
      startTime: 1,
    });
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Server error fetching events" });
  }
});


router.get("/other-events", auth, async (req, res) => {
  try {
    const others = await Event.find({
      owner: { $ne: req.user._id },
    })
      .populate("owner", "name email")
      .sort({ startTime: 1 });

    res.json(others);
  } catch (err) {
    console.error("Error fetching other events:", err);
    res.status(500).json({ error: "Server error fetching other events" });
  }
});

router.patch("/:id", auth, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ error: "Event not found" });

    if (String(ev.owner) !== String(req.user._id))
      return res.status(403).json({ error: "Unauthorized" });

    const allowed = ["title", "startTime", "endTime", "status"];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) ev[key] = req.body[key];
    });

    await ev.save();
    res.json(ev);
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: "Server error updating event" });
  }
});


router.delete("/:id", auth, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ error: "Event not found" });
    if (String(ev.owner) !== String(req.user._id))
      return res.status(403).json({ error: "Unauthorized" });

    await Event.deleteOne({ _id: ev._id });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Server error deleting event" });
  }
});

module.exports = router;
