// models/Founder.model.js
import mongoose from 'mongoose';

const founderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Founder name is required'],
    trim: true
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description:{
    type: String,
    required: [true, 'Description is required']
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
founderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Founder = mongoose.model('Founder', founderSchema);

export default Founder;