const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../.env' });

const User = require('../models/UserModel');
const Description = require('../models/DescriptionModel');
const Task = require('../models/TaskModel');
const Attendance = require('../models/AttendanceModel'); // You need to create this model

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://meetpatel26315:9suRmJXPmO0PUnsy@cluster0.k4qwy.mongodb.net/TaskAssigner';

async function seed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Clear existing data
  await User.deleteMany({});
  await Description.deleteMany({});
  await Task.deleteMany({});
  await Attendance.deleteMany({}); // Clear attendance

  // Add specific admin and hr users
  const prakashPassword = await bcrypt.hash('prakash123', 10);
  const hrPassword = await bcrypt.hash('hr123', 10);
  const specialUsers = [
    new User({
      name: 'Prakash',
      phone: 9000000011,
      email: 'prakash@gmail.com',
      password: prakashPassword,
      profile_pic: '',
      role: 'admin'
    }),
    new User({
      name: 'HR User',
      phone: 9000000012,
      email: 'hr123@gmail.com',
      password: hrPassword,
      profile_pic: '',
      role: 'hr'
    })
  ];
  await User.insertMany(specialUsers);

  // Create 10 users
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const hashedPassword = await bcrypt.hash(`Password${i}`, 10);
    users.push(new User({
      name: `User${i}`,
      phone: 9000000000 + i,
      email: `user${i}@example.com`,
      password: hashedPassword,
      profile_pic: '',
      role: 'user' // Changed to 'user'
    }));
  }
  await User.insertMany(users);

  // For each user, create 5 descriptions and 5 tasks (all in March)
  const allUsers = await User.find({});
  for (const user of allUsers) {
    const descriptions = [];
    for (let j = 1; j <= 5; j++) {
      descriptions.push(new Description({
        title: `Task Title ${j} for ${user.name}`,
        description: `Description ${j} for ${user.name}`,
        user: user._id,
        createdAt: new Date(`2024-03-${String(j).padStart(2, '0')}T09:00:00Z`)
      }));
    }
    const savedDescriptions = await Description.insertMany(descriptions);

    // For each description, create a task on a different day in March
    for (let k = 0; k < 5; k++) {
      const day = 10 + k; // Days 10-14 March
      await Task.create({
        learning: `Learning note ${k + 1} for ${user.name}`,
        startTime: new Date(`2024-03-${day}T09:00:00Z`),
        endTime: new Date(`2024-03-${day}T17:00:00Z`),
        user: user._id,
        descriptionId: savedDescriptions[k]._id,
        timeSlots: [
          {
            startTime: '09:00:00',
            endTime: '11:00:00',
            notes: `Morning work for ${user.name}`
          },
          {
            startTime: '11:00:00',
            endTime: '13:00:00',
            notes: `Midday work for ${user.name}`
          },
          {
            startTime: '14:00:00',
            endTime: '17:00:00',
            notes: `Afternoon work for ${user.name}`
          }
        ],
        status: 'Completed',
        createdAt: new Date(`2024-03-${day}T09:00:00Z`),
        updatedAt: new Date(`2024-03-${day}T17:00:00Z`)
      });
    }
  }

  // Attendance seeding for Feb, Mar, Apr (up to 18th) 2025
  const months = [
    { month: 2, days: 28 }, // Feb 2025
    { month: 3, days: 31 }, // Mar 2025
    { month: 4, days: 18 }  // Apr 2025 (up to 18th)
  ];
  const startTime = "08:30";
  const endTime = "17:00";
  const duration = 8.5; // hours

  for (const user of allUsers) {
    for (const m of months) {
      for (let d = 1; d <= m.days; d++) {
        await Attendance.create({
          user: user._id,
          date: new Date(`2025-${String(m.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
          startTime,
          endTime,
          duration
        });
      }
    }
  }

  // Seed descriptions and tasks for every user from 02-Feb-2025 to 05-Apr-2025
  const startDate = new Date('2025-02-02');
  const endDate = new Date('2025-04-05');
  for (const user of allUsers) {
    let current = new Date(startDate);
    while (current <= endDate) {
      // Create a description for the day
      const desc = await Description.create({
        title: `Daily Task for ${user.name} on ${current.toISOString().slice(0, 10)}`,
        description: `Auto-generated description for ${user.name} on ${current.toISOString().slice(0, 10)}`,
        user: user._id,
        createdAt: new Date(current),
        updatedAt: new Date(current)
      });

      // Create a task for the day, referencing the description
      await Task.create({
        learning: `Learning note for ${user.name} on ${current.toISOString().slice(0, 10)}`,
        startTime: new Date(`${current.toISOString().slice(0, 10)}T09:00:00Z`),
        endTime: new Date(`${current.toISOString().slice(0, 10)}T17:00:00Z`),
        user: user._id,
        descriptionId: desc._id,
        timeSlots: [
          {
            startTime: '09:00:00',
            endTime: '12:00:00',
            notes: `Morning work for ${user.name}`
          },
          {
            startTime: '13:00:00',
            endTime: '17:00:00',
            notes: `Afternoon work for ${user.name}`
          }
        ],
        status: 'Completed',
        createdAt: new Date(current),
        updatedAt: new Date(current)
      });

      // Next day
      current.setDate(current.getDate() + 1);
    }
  }

  console.log('Seed data inserted successfully!');

  // Find user1 and print email and password hash
  const user1 = await User.findOne({ name: 'User1' });
  if (user1) {
    console.log(`User1 email: user1@example.com`);
    console.log(`User1 password: Password1`);
    console.log(`User1 password hash: ${user1.password}`);
  } else {
    console.log('User1 not found.');
  }

  mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
