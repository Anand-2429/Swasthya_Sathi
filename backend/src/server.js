const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Set critical environment variables directly if not found in .env
if (!process.env.JWT_SECRET) {
  console.log('JWT_SECRET not found in .env, setting default value');
  process.env.JWT_SECRET = 'healthcareplatformsecretkey12345678901234567890';
}

// Set Flask API URL if not found in .env
if (!process.env.FLASK_API_URL) {
  console.log('FLASK_API_URL not found in .env, setting default value');
  process.env.FLASK_API_URL = 'http://localhost:5001/predict';
}

if (result.error) {
  console.error('Error loading .env file:', result.error.message);
} else {
  console.log('.env file loaded successfully');
}

// Debug: Check if JWT_SECRET is loaded
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

// Import routes
const authRoutes = require('./routes/auth.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const adminRoutes = require('./routes/admin.routes');
const chatRoutes = require('./routes/chat.routes');
const postRoutes = require('./routes/post.routes');
const summaryRoutes = require('./routes/summary.routes');
const diseaseRoutes = require('./routes/disease.routes');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload middleware
app.use(fileUpload({
  createParentPath: true, // Creates the directory automatically
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  abortOnLimit: true,
  useTempFiles: true, // Keep files in memory by default
  tempFileDir: '/tmp/', // Use Render's allowed temp directory
  parseNested: true,
  debug: process.env.NODE_ENV === 'development',
  safeFileNames: true,
  preserveExtension: true
}));

// Serve static files from uploads directory
const uploadPath = process.env.FILE_UPLOAD_PATH || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadPath)));

// Connect to MongoDB


mongoose.connect(
  'mongodb://richasingh2429:Richa2429@ac-dipbn8z-shard-00-00.awinqs9.mongodb.net:27017,ac-dipbn8z-shard-00-01.awinqs9.mongodb.net:27017,ac-dipbn8z-shard-00-02.awinqs9.mongodb.net:27017/test?replicaSet=atlas-5o0d6v-shard-0&ssl=true&authSource=admin',
  {
    tlsAllowInvalidCertificates: true, // Only for testing
    serverSelectionTimeoutMS: 10000,   // Optional: helps debug
  }
)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/disease', diseaseRoutes);

// API health check endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Healthcare Platform API is running', status: 'ok' });
});

// Default route
app.get('/', (req, res) => {
  res.send('Healthcare Platform API is running');
});

// Socket.io connection
require('./utils/socket')(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
}); 