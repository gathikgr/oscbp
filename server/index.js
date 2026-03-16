import express from 'express';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json({ limit: '2mb' }));

const memoryStore = [];
let Experiment;

const uri = process.env.MONGODB_URI;
if (uri) {
  mongoose.connect(uri).then(() => {
    const schema = new mongoose.Schema({
      allocation: [[Number]],
      request: [[Number]],
      available: [Number],
      detect: Object,
      banker: Object,
      executionTime: Number,
      createdAt: String
    });
    Experiment = mongoose.model('Experiment', schema);
    console.log('MongoDB connected');
  }).catch((e) => console.warn('MongoDB unavailable, using memory store', e.message));
}

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.post('/api/experiments', async (req, res) => {
  try {
    if (Experiment) {
      const doc = await Experiment.create(req.body);
      return res.json(doc);
    }
    memoryStore.unshift(req.body);
    return res.json({ saved: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.get('/api/experiments', async (_, res) => {
  if (Experiment) return res.json(await Experiment.find().sort({ _id: -1 }).limit(20));
  return res.json(memoryStore.slice(0, 20));
});

app.listen(PORT, () => console.log(`API running on ${PORT}`));
