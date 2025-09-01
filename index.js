import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import Connection from './src/config/connection.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import AdminRoutes from "./src/routes/AdminRoutes.js";
import ContactRoutes from "./src/routes/ContactRoutes.js";
import BlogRoutes from "./src/routes/BlogRoutes.js";
import ServiceRoutes from "./src/routes/ServiceRoutes.js";
import SubServiceRoutes from "./src/routes/SubServiceRoutes.js";
import TeamMemberRoutes from './src/routes/TeamMemberRoutes.js';
import GalleryRoutes from "./src/routes/GalleryRoutes.js";
import TestimonialRoutes from "./src/routes/TestimonialRoutes.js";
import FounderRoutes from './src/routes/FounderRoutes.js';
import ContactInfoRoute from './src/routes/ContactInfoRoute.js';
import FeatureRoutes from './src/routes/featureRoutes.js';
import aboutRoutes from './src/routes/aboutRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3005;
const API = process.env.API || 'api/v1';

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ CORS (allow all origins)
app.use(cors({
  origin: true,  // allow all origins dynamically
  credentials: true,
}));

// ✅ Preflight requests
app.options('*', cors());

// Optional: log requests
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    origin: req.get('origin'),
  });
  next();
});

// Routes
app.use(`/${API}/admin`, AdminRoutes);
app.use(`/${API}/contact`, ContactRoutes);
app.use(`/${API}/blogs`, BlogRoutes);
app.use(`/${API}/services`, ServiceRoutes);
app.use(`/${API}/subservices`, SubServiceRoutes);
app.use(`/${API}/team`, TeamMemberRoutes);
app.use(`/${API}/gallery`, GalleryRoutes);
app.use(`/${API}/testimonial`, TestimonialRoutes);
app.use(`/${API}/founders`, FounderRoutes);
app.use(`/${API}/contactinfo`, ContactInfoRoute);
app.use(`/${API}/features`, FeatureRoutes);
app.use(`/${API}/about`, aboutRoutes);

// Root
app.get('/', (req, res) => {
  res.send('NEW EDITOR Changes with image API is running...');
});

// Global Error handler (always include CORS headers)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.header('Access-Control-Allow-Origin', req.get('origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Connect DB and start server
Connection()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("Failed to connect to database:", err));
