// scripts/createUsers.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const users = [
  {
    username: 'emin',
    password: 'emin123',
    name: 'Emin',
    role: 'user'
  },
  {
    username: 'emirhan',
    password: 'emirhan123',
    name: 'Emirhan',
    role: 'user'
  },
  {
    username: 'cagla',
    password: 'cagla123',
    name: 'Çağla',
    role: 'user'
  },
  {
    username: 'hakan',
    password: 'hakan123',
    name: 'Hakan',
    role: 'user'
  },
  {
    username: 'furkan',
    password: 'furkan123',
    name: 'Furkan',
    role: 'user'
  },
  {
    username: 'nazmi',
    password: 'nazmi123',
    name: 'Nazmi',
    role: 'user'
  }
];

const createUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    for (const userData of users) {
      const existingUser = await User.findOne({ username: userData.username });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({
          ...userData,
          password: hashedPassword
        });
        await user.save();
        console.log(`${userData.name} kullanıcısı başarıyla oluşturuldu!`);
      } else {
        console.log(`${userData.name} kullanıcısı zaten mevcut.`);
      }
    }

    console.log('Tüm kullanıcılar başarıyla oluşturuldu!');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

createUsers();