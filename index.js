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
import ContactInfoRoute from './src/routes/ContactInfoRoute.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const API = process.env.API || 'api/v1';


// Middleware
app.use(cookieParser());
app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://184.168.125.236',
  'http://184.168.125.236:3000',
  'http://184.168.125.236:3005',
  'http://184.168.125.236:3001',
  'http://184.168.125.236:5173',
  'http://184.168.125.236:4173',
  'https://www.victoriaclean.com.au',
  'https://victoriaclean.com.au',
  'http://www.victoriaclean.com.au',
  'http://victoriaclean.com.au'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For development, allow all localhost and IP-based origins
      if (origin.startsWith('http://localhost:') || 
          origin.startsWith('http://127.0.0.1:') ||
          origin.match(/^http:\/\/\d+\.\d+\.\d+\.\d+:\d+/)) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Handle preflight requests
app.options('*', cors());

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
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server accessible at http://184.168.125.236:${PORT}`);
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
app.use(`/${API}/founders`, FounderRoutes);
app.use(`/${API}/contactinfo`, ContactInfoRoute);



app.get('/', (req, res) => {
  res.send('Victoria API is running...');
});