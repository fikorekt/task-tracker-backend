// models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: '' // Varsayılan açıklama
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['bekliyor', 'calısılıyor', 'tamamlandı'],
    default: 'bekliyor'
  },
  priority: {
    type: String,
    enum: ['dusuk', 'normal', 'yuksek'],
    default: 'normal'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastStatusUpdate: {
    type: Date
  },
  assignedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});



// Görev güncellenmeden önce
taskSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.lastStatusUpdate = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
