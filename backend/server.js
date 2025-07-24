const express = require('express');
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
const corsOptions = {
  origin: "http://192.168.1.51", // or wherever your frontend is hosted
  methods: ["GET", "POST"],
  credentials: true // 💡 Required to allow cookie session
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Sessions for admin ---
app.use(session({
  secret: 'slowwman_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    sameSite: 'lax'
  }
}));


// --- Rate Limiter for contact ---
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again later.'
});
app.use('/contact', contactLimiter);

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// --- MongoDB Schema ---
const Contact = mongoose.model('Contact', new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
}));

// --- Admin Login ---
app.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.authenticated = true;
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: "Invalid password" });
  }
});

// --- Fetch Messages (Protected) ---
app.get('/messages', async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const messages = await Contact.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Contact Form Submission ---
app.post('/contact',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, email, message } = req.body;

    try {
      // Save to DB
      const newContact = new Contact({ name, email, message });
      await newContact.save();

      // Setup email transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      // Admin Notification
      await transporter.sendMail({
        from: `"Slowwman Website" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong><br>${message}</p>
        `
      });

      // Confirmation to User
      await transporter.sendMail({
        from: `"The Slowwman Team" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `Thanks for contacting The Slowwman Company`,
        html: `
          <p>Hi ${name},</p>
          <p>Thank you for reaching out to us. We have received your message and will get back to you shortly.</p>
          <br>
          <p>Regards,<br>The Slowwman Team</p>
        `
      });

      res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
      console.error('❌ Error sending email or saving to DB:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// --- Custom 404 Page ---
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
