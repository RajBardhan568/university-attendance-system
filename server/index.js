// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();

// const teacherRoutes = require('./routes/teacher');
// const studentRoutes = require('./routes/student');

// app.use(express.json());
// app.use(cors());
// app.use('/api/teacher', teacherRoutes);
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/student', studentRoutes);

// // Connect to MongoDB (You will need to put your own URL in a .env file later)
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("Database Connected!"))
//   .catch(err => console.log(err));

// // Test Route
// app.get('/', (req, res) => res.send("Attendance System API Running"));


// const PORT = 5000;
// app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// module.exports = app;


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

app.use(express.json());
app.use(cors());

app.use('/api/teacher', teacherRoutes);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/student', studentRoutes);

// Test Route
app.get('/', (req, res) => res.send("Attendance System API Running"));

// MongoDB Connection Cache for Serverless (Vercel)
let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    isConnected = db.connections[0].readyState;
    console.log("Database Connected!");
  } catch (error) {
    console.log("MongoDB Connection Error:", error);
  }
}

// Middleware to ensure DB is connected before every request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

module.exports = app;