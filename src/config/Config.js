import dotenv from "dotenv";
dotenv.config();

const Config = {
  mongoURI: process.env.Mongo_URI,
  port: process.env.PORT || 3005,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "some_default_refresh_secret",
  jwtAccessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "3600",  // in seconds
  jwtRefreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "86400", // in seconds
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  apiPrefix: process.env.API || "api/v1",
};

export default Config;
