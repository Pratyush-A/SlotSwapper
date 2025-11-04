const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../models/Event');

//Create
router.post('/', auth, async (req, res) => {
  try {
    const { title, startTime, endTime } = req.body;
    const ev = await Event.create({ title, startTime, endTime, owner: req.user._id, status: 'BUSY' });
    res.json(ev);
  } catch(err){ console.error(err); res.status(500).json({ error: 'Server error' }); }
});

//Read
router.get('/me', auth, async (req, res) => {
  const events = await Event.find({ owner: req.user._id }).sort({ startTime: 1 });
  res.json(events);
});

//Update event 
router.patch('/:id', auth, async (req, res) => {
  try {
    const ev = await Event.findById(req.params.id);
    if(!ev) return res.status(404).json({ error: 'Not found' });
    if(String(ev.owner) !== String(req.user._id)) return res.status(403).json({ error: 'Not allowed' });
    const allowed = ['title','startTime','endTime','status'];
    allowed.forEach(k => { if(req.body[k] !== undefined) ev[k] = req.body[k]; });
    await ev.save();
    res.json(ev);
  } catch(err){ console.error(err); res.status(500).json({ error: 'Server error' }); }
});

//Delete
router.delete('/:id', auth, async (req, res) => {
  const ev = await Event.findById(req.params.id);
  if(!ev) return res.status(404).json({ error: 'Not found' });
  if(String(ev.owner) !== String(req.user._id)) return res.status(403).json({ error: 'Not allowed' });
  await ev.remove();
  res.json({ success: true });
});

module.exports = router;
