import mongoose from 'mongoose';

const busSchema = mongoose.Schema(
  {
    busNumber: {
      type: String,
      required: true,
      unique: true,
    },
    route: {
      type: String,
      required: true,
    },
    driver: {
      type: String,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
      default: 40,
    },
    departureTime: {
      type: String,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Bus = mongoose.model('Bus', busSchema);

export default Bus;