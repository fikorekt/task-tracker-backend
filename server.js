// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http'); // HTTP sunucusu
const { Server } = require('socket.io'); // Socket.IO

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

dotenv.config();

const app = express();
const server = http.createServer(app); // HTTP sunucusunu oluştur
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Frontend URL'si
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://task-tracker-backend-qgah.onrender.com"],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true,
}));
app.use(express.json());

// Socket.IO entegrasyonu
io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  // İstemci bağlantısını kestiğinde
  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı:', socket.id);
  });
});

// Express Uygulamasına Socket.IO'yu ekle
app.set('socketio', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// MongoDB Bağlantısı
const isProduction = process.env.NODE_ENV === 'production';
const mongoUri = isProduction
  ? process.env.MONGODB_URI_PRODUCTION
  : process.env.MONGODB_URI;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB\'ye başarıyla bağlandı'))
  .catch((err) => console.error('MongoDB bağlantı hatası:', err));

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});
