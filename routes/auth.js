// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Kayıt ol
router.post('/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;

    // Kullanıcı adı kontrolü
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' });
    }

    // Şifre hashleme
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcı oluşturma
    const user = new User({
      username,
      password: hashedPassword,
      name
    });

    await user.save();

    // Token oluşturma
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(400).json({ error: 'Kayıt işlemi başarısız.' });
  }
});

// Giriş yap
router.post('/login', async (req, res) => {
  try {
    console.log('Gelen login isteği:', req.body);
    const { username, password } = req.body;

    // Kullanıcı kontrolü
    const user = await User.findOne({ username });
    if (!user) {
      console.log('Kullanıcı bulunamadı:', username);
      return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
    }

    // Şifre kontrolü
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Şifre eşleşmesi:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
    }

    // Token oluşturma
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userData = {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role
    };

    console.log('Giriş başarılı, gönderilen veri:', { token, user: userData });

    res.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(400).json({ error: 'Giriş işlemi başarısız.' });
  }
});

// Tüm kullanıcıları getir
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({})
      .select('name username role _id')
      .sort({ name: 1 });
    
    console.log('Kullanıcılar gönderiliyor:', users);
    res.json(users);
  } catch (error) {
    console.error('Kullanıcıları getirme hatası:', error);
    res.status(500).json({ error: 'Kullanıcılar getirilemedi.' });
  }
});

// Mevcut kullanıcının bilgilerini getir
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Kullanıcı bilgileri getirme hatası:', error);
    res.status(500).json({ error: 'Kullanıcı bilgileri getirilemedi.' });
  }
});

module.exports = router;