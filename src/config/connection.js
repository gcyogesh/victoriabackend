import mongoose from 'mongoose';

const Connection = async () => {
  try {
    await mongoose.connect(process.env.Mongo_URI);
    console.log("Connection established successfully in MongoDB Atlas");
  } catch (err) {
    console.log("Connection failed unfortunately", err);
    throw err;
  }
};

export default Connection;
