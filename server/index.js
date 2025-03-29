import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Session Schema with enhanced tracking
const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  wpm: Number,
  accuracy: Number,
  errors: Number,
  duration: Number,
  errorWords: [{ 
    word: String, 
    count: Number 
  }],
  typingPatterns: {
    pausesBefore: [{ 
      word: String, 
      duration: Number 
    }],
    speedVariations: [{
      timestamp: Number,
      wpm: Number,
      afterError: Boolean
    }],
    recoveryTimes: [{
      errorTimestamp: Number,
      recoveryDuration: Number
    }]
  },
  psychologicalMetrics: {
    impulsivityScore: Number, // High WPM with high errors = impulsive
    deliberationScore: Number, // Low WPM with high accuracy = deliberate
    cognitiveLoadScore: Number, // Struggles with long words/complex sentences
    resilienceScore: Number, // Recovery speed after errors
    anxietyScore: Number // Performance variation near end of timer
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Session Routes
app.post('/api/sessions', auth, async (req, res) => {
  try {
    const session = await Session.create({
      userId: req.userId,
      ...req.body
    });
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/sessions', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Analysis Routes
app.get('/api/analysis/error-patterns', auth, async (req, res) => {
  try {
    const errorPatterns = await Session.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $unwind: '$errorWords' },
      { 
        $group: {
          _id: '$errorWords.word',
          totalErrors: { $sum: '$errorWords.count' }
        }
      },
      { $sort: { totalErrors: -1 } },
      { $limit: 10 }
    ]);
    res.json(errorPatterns);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/analysis/psychological', auth, async (req, res) => {
  try {
    const insights = await Session.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { 
        $group: {
          _id: null,
          avgImpulsivity: { $avg: '$psychologicalMetrics.impulsivityScore' },
          avgDeliberation: { $avg: '$psychologicalMetrics.deliberationScore' },
          avgCognitiveLoad: { $avg: '$psychologicalMetrics.cognitiveLoadScore' },
          avgResilience: { $avg: '$psychologicalMetrics.resilienceScore' },
          avgAnxiety: { $avg: '$psychologicalMetrics.anxietyScore' }
        }
      }
    ]);
    res.json(insights[0] || {});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});