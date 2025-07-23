import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import Connection from './src/config/connection.js';
import cors from 'cors';

import AdminRoutes from "./src/routes/AdminRoutes.js";
import ContactRoutes from "./src/routes/ContactRoutes.js";
import BlogRoutes from "./src/routes/BlogRoutes.js";
import ServiceRoutes from "./src/routes/ServiceRoutes.js";
import SubServiceRoutes from "./src/routes/SubServiceRoutes.js";
import TeamMemberRoutes from './src/routes/TeamMemberRoutes.js';
import CompanyRoutes from './src/routes/CompanyRoutes.js'
import GalleryRoutes from "./src/routes/GalleryRoutes.js"
import TestimonialRoutes from "./src/routes/TestimonialRoutes.js"
import FounderRoutes from './src/routes/FounderRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const API = process.env.API || 'api/v1';


// Middleware
app.use(cookieParser());
app.use(express.json());

const allowedOrigins = ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Connect to Database and start server
Connection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("Failed to connect to database", err);
  });

// Routes
app.use(`/${API}/admin`, AdminRoutes);
app.use(`/${API}/contact`, ContactRoutes);
app.use(`/${API}/blogs`, BlogRoutes);
app.use(`/${API}/services`, ServiceRoutes);
app.use(`/${API}/subservices`, SubServiceRoutes);
app.use(`/${API}/team`, TeamMemberRoutes);
app.use(`/${API}/company`, CompanyRoutes);
app.use(`/${API}/gallery`, GalleryRoutes);
app.use(`/${API}/testimonial`, TestimonialRoutes);
app.use(`/${API}/founders`,FounderRoutes);


app.get('/', (req, res) => {
  res.send('Victoria API is running...');
});