// routes/tasks.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');


// Görev oluştur
router.post('/', auth, async (req, res) => {
  try {
    console.log('Yeni görev isteği:', req.body); // Frontend'den gelen görev verisi

    const task = new Task({
      ...req.body,
      createdBy: req.user.id,
      status: 'bekliyor', // Varsayılan durum
      lastUpdatedBy: req.user.id,
      assignedAt: req.body.assignedTo ? new Date() : null, // Atanan görev için tarih
    });

    await task.save();
    await task.populate('assignedTo', 'name username');
    await task.populate('createdBy', 'name username');
    await task.populate('lastUpdatedBy', 'name username');

    console.log('MongoDB\'ye kaydedilen görev:', task); // Yeni görev bilgisi

    // WebSocket üzerinden bildirim gönder
    const io = req.app.get('socketio');
    if (task.assignedTo) {
      io.emit('new-task', { task });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Görev oluşturma hatası:', error);
    res.status(400).json({
      error: 'Görev oluşturulamadı.',
      details: error.message,
    });
  }
});


// Tüm görevleri listele
router.get('/', auth, async (req, res) => {
  try {
    const { filter, status, priority } = req.query;
    const filterCriteria = {};

    if (status) filterCriteria.status = status;
    if (priority) filterCriteria.priority = priority;

    // Kullanıcıya özel filtreleme
    if (filter === 'assigned') {
      filterCriteria.assignedTo = req.user.id; // Bana atanan görevler
    } else if (filter === 'created') {
      filterCriteria.createdBy = req.user.id; // Kullanıcının oluşturduğu görevler
    }

    // Konsola filtreleri yazdır
    console.log('Frontend\'den gelen filter:', filter); // Gelen filter parametresi
    console.log('Oluşturulan filterCriteria:', filterCriteria); // MongoDB sorgusu için oluşturulan kriterler

    const tasks = await Task.find(filterCriteria)
      .populate('assignedTo', 'name username')
      .populate('createdBy', 'name username')
      .populate('lastUpdatedBy', 'name username')
      .sort({ createdAt: -1 });

    console.log('MongoDB\'den dönen görevler:', tasks); // Sorgu sonucu

    res.json(tasks);
  } catch (error) {
    console.error('Görevleri getirme hatası:', error);
    res.status(500).json({ error: 'Görevler getirilemedi.' });
  }
});






// Görevi güncelle
router.patch('/:id', auth, async (req, res) => {
  try {
    console.log('Güncelleme isteği:', req.body); // Frontend'den gelen güncelleme verisi

    const task = await Task.findOne({ _id: req.params.id });

    if (!task) {
      console.log('Görev bulunamadı:', req.params.id); // Görev bulunamadı hatası
      return res.status(404).json({ error: 'Görev bulunamadı.' });
    }

    console.log('Güncellenmeden önceki görev:', task); // Güncellemeden önceki görev durumu

    // Tüm kullanıcılar görev durumunu değiştirebilir
    const allowedUpdates = ['status'];
    const updates = Object.keys(req.body);

    updates.forEach(update => {
      if (allowedUpdates.includes(update)) {
        task[update] = req.body[update];
      }
    });

    task.lastUpdatedBy = req.user.id;
    task.lastStatusUpdate = new Date();

    await task.save();
    await task.populate('assignedTo', 'name username');
    await task.populate('createdBy', 'name username');
    await task.populate('lastUpdatedBy', 'name username');

    console.log('Güncellenmiş görev:', task); // Güncellemeden sonraki görev durumu
    res.json(task);
  } catch (error) {
    console.error('Görev güncelleme hatası:', error);
    res.status(400).json({ error: 'Görev güncellenemedi.', details: error.message });
  }
});

// Görevi sil (sadece admin silebilir)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Silme isteği:', req.params.id); // Silinmek istenen görev ID'si

    if (req.user.role !== 'admin') {
      console.log('Yetkisiz silme girişimi:', req.user.id); // Yetkisiz kullanıcı
      return res.status(403).json({ error: 'Görev silme yetkiniz yok.' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      console.log('Görev bulunamadı:', req.params.id); // Görev bulunamadı
      return res.status(404).json({ error: 'Görev bulunamadı.' });
    }

    console.log('Silinen görev:', task); // Silinen görev bilgisi
    res.json({ message: 'Görev başarıyla silindi', task });
  } catch (error) {
    console.error('Görev silme hatası:', error);
    res.status(500).json({ 
      error: 'Görev silinemedi.',
      details: error.message 
    });
  }
});

module.exports = router;
