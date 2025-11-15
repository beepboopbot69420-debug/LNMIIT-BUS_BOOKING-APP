import asyncHandler from 'express-async-handler';
import Bus from '../models/busModel.js';
import Booking from '../models/bookingModel.js';

// @desc    Get all buses with booked seat counts
// @route   GET /api/buses
// @access  Private (Student)
const getAllBuses = asyncHandler(async (req, res) => {
  const buses = await Bus.find({});
  
  // Get booking counts for all buses
  const bookings = await Booking.aggregate([
    { $match: { status: 'confirmed' } },
    { $group: { _id: "$bus", bookedSeats: { $sum: 1 } } }
  ]);

  const busesWithCounts = buses.map(bus => {
    const bookingInfo = bookings.find(b => b._id.toString() === bus._id.toString());
    return {
      id: bus._id,
      busNumber: bus.busNumber,
      route: bus.route,
      departureTime: bus.departureTime,
      arrivalTime: bus.arrivalTime,
      totalSeats: bus.totalSeats,
      bookedSeats: bookingInfo ? bookingInfo.bookedSeats : 0,
    };
  });

  res.json(busesWithCounts);
});

// @desc    Get single bus details with seat layout
// @route   GET /api/buses/:id
// @access  Private (Student)
const getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);

  if (!bus) {
    res.status(404);
    throw new Error('Bus not found');
  }

  // Find all confirmed booked seats for this bus
  const bookings = await Booking.find({ bus: req.params.id, status: 'confirmed' });
  const bookedSeatNumbers = bookings.map(b => b.seatNumber);

  // Create seat layout for frontend (matching BookSeat.tsx)
  const totalSeats = bus.totalSeats;
  const seats = [];
  for (let i = 1; i <= totalSeats; i++) {
    const seatNumber = i;
    const isBooked = bookedSeatNumbers.includes(seatNumber);
    
    // Logic to match the 10x4 layout
    const row = Math.floor((i - 1) / 4) + 1;
    const col = ((i - 1) % 4) + 1;

    seats.push({
      id: `${row}-${col}`,
      row,
      number: seatNumber,
      status: isBooked ? 'booked' : 'available',
    });
  }

  res.json({
    bus,
    seats,
    availableCount: totalSeats - bookedSeatNumbers.length,
    bookedCount: bookedSeatNumbers.length,
  });
});

// --- ADMIN CONTROLLERS ---

// @desc    Create a new bus
// @route   POST /api/buses
// @access  Private (Admin)
const createBus = asyncHandler(async (req, res) => {
  const { busNumber, route, driver, totalSeats, departureTime, arrivalTime } = req.body;

  const busExists = await Bus.findOne({ busNumber });
  if (busExists) {
    res.status(400);
    throw new Error('Bus with this number already exists');
  }

  const bus = new Bus({
    busNumber,
    route,
    driver,
    totalSeats,
    departureTime,
    arrivalTime
  });

  const createdBus = await bus.save();
  res.status(201).json(createdBus);
});

// @desc    Update a bus
// @route   PUT /api/buses/:id
// @access  Private (Admin)
const updateBus = asyncHandler(async (req, res) => {
  const { busNumber, route, driver, totalSeats, departureTime, arrivalTime } = req.body;

  const bus = await Bus.findById(req.params.id);

  if (bus) {
    bus.busNumber = busNumber || bus.busNumber;
    bus.route = route || bus.route;
    bus.driver = driver || bus.driver;
    bus.totalSeats = totalSeats || bus.totalSeats;
    bus.departureTime = departureTime || bus.departureTime;
    bus.arrivalTime = arrivalTime || bus.arrivalTime;

    const updatedBus = await bus.save();
    res.json(updatedBus);
  } else {
    res.status(404);
    throw new Error('Bus not found');
  }
});

// @desc    Delete a bus
// @route   DELETE /api/buses/:id
// @access  Private (Admin)
const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);

  if (bus) {
    await bus.deleteOne();
    // Also delete associated bookings and waiting lists (or handle as needed)
    await Booking.deleteMany({ bus: req.params.id });
    // await WaitingList.deleteMany({ bus: req.params.id });
    res.json({ message: 'Bus removed' });
  } else {
    res.status(404);
    throw new Error('Bus not found');
  }
});

export { getAllBuses, getBusById, createBus, updateBus, deleteBus };