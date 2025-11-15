import asyncHandler from 'express-async-handler';
import Booking from '../models/bookingModel.js';
import Bus from '../models/busModel.js';
import WaitingList from '../models/waitingListModel.js';
import User from '../models/userModel.js';
import sendEmail from '../utils/sendEmail.js';

// Helper function to process the waiting list
const processWaitingList = async (busId) => {
  const bus = await Bus.findById(busId);
  if (!bus) return;

  // Find all available seats
  const bookings = await Booking.find({ bus: busId, status: 'confirmed' });
  const bookedSeatNumbers = bookings.map(b => b.seatNumber);
  
  let availableSeat = -1;
  for (let i = 1; i <= bus.totalSeats; i++) {
    if (!bookedSeatNumbers.includes(i)) {
      availableSeat = i;
      break;
    }
  }

  // If a seat is available, find the first person on the waiting list
  if (availableSeat !== -1) {
    const waitingUser = await WaitingList.findOne({ bus: busId }).sort({ createdAt: 1 });
    
    if (waitingUser) {
      // Create a booking for this user
      await Booking.create({
        user: waitingUser.user,
        bus: bus._id,
        busNumber: bus.busNumber,
        route: bus.route,
        seatNumber: availableSeat,
        departureTime: bus.departureTime,
        status: 'confirmed',
      });

      // Remove user from waiting list
      await waitingUser.deleteOne();

      // Send notification email [cite: 35]
      const user = await User.findById(waitingUser.user);
      if (user) {
        await sendEmail({
          email: user.email,
          subject: 'You\'re off the waiting list! (LNMIIT Bus)',
          message: `Great news, ${user.name}!\n\nA seat has become available on bus ${bus.busNumber} (${bus.route}) departing at ${bus.departureTime}. Your seat number is ${availableSeat}.\n\nYour booking is confirmed.`,
        });
      }
    }
  }
};

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private (Student)
const createBooking = asyncHandler(async (req, res) => {
  const { busId, seatNumber } = req.body;
  const userId = req.user._id;

  const bus = await Bus.findById(busId);
  if (!bus) {
    res.status(404);
    throw new Error('Bus not found');
  }

  // Check if seat is already booked
  const isBooked = await Booking.findOne({
    bus: busId,
    seatNumber,
    status: 'confirmed',
  });

  if (isBooked) {
    res.status(400);
    throw new Error('This seat is already booked');
  }

  // Check if user already has a booking on this bus
  const userHasBooking = await Booking.findOne({
    user: userId,
    bus: busId,
    status: 'confirmed',
  });

  if (userHasBooking) {
    res.status(400);
    throw new Error('You already have a booking on this bus');
  }

  // Create booking
  const booking = await Booking.create({
    user: userId,
    bus: bus._id,
    busNumber: bus.busNumber,
    route: bus.route,
    seatNumber,
    departureTime: bus.departureTime,
    status: 'confirmed',
  });

  if (booking) {
    // Send confirmation email [cite: 35]
    await sendEmail({
      email: req.user.email,
      subject: 'Booking Confirmed (LNMIIT Bus)',
      message: `Hi ${req.user.name},\n\nYour booking is confirmed!\n\nBus: ${bus.busNumber} (${bus.route})\nSeat: ${seatNumber}\nDeparture: ${bus.departureTime}\n\nThank you for using the service.`,
    });

    res.status(201).json(booking);
  } else {
    res.status(400);
    throw new Error('Invalid booking data');
  }
});

// @desc    Get logged in user's bookings
// @route   GET /api/bookings/mybookings
// @access  Private (Student)
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(bookings);
});

// @desc    Cancel a booking
// @route   DELETE /api/bookings/:id
// @access  Private (Student)
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if user owns this booking
  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to cancel this booking');
  }

  // "Delete" the booking (or set status to 'cancelled')
  await booking.deleteOne();
  
  // Send cancellation email [cite: 35]
  await sendEmail({
    email: req.user.email,
    subject: 'Booking Cancelled (LNMIIT Bus)',
    message: `Hi ${req.user.name},\n\nYour booking for seat ${booking.seatNumber} on bus ${booking.busNumber} has been successfully cancelled.`,
  });

  // Trigger waiting list processing [cite: 34]
  processWaitingList(booking.bus);

  res.json({ message: 'Booking cancelled successfully' });
});

// @desc    Join waiting list for a bus
// @route   POST /api/bookings/waitlist
// @access  Private (Student)
const joinWaitingList = asyncHandler(async (req, res) => {
  const { busId } = req.body;
  const userId = req.user._id;

  const bus = await Bus.findById(busId);
  if (!bus) {
    res.status(404);
    throw new Error('Bus not found');
  }

  // Check if bus is actually full
  const bookingCount = await Booking.countDocuments({ bus: busId, status: 'confirmed' });
  if (bookingCount < bus.totalSeats) {
    res.status(400);
    throw new Error('This bus is not full. Please book a seat directly.');
  }

  // Check if user is already on the list
  const alreadyWaiting = await WaitingList.findOne({ user: userId, bus: busId });
  if (alreadyWaiting) {
    res.status(400);
    throw new Error('You are already on the waiting list for this bus');
  }
  
  // Check if user already has a booking
  const hasBooking = await Booking.findOne({ user: userId, bus: busId, status: 'confirmed' });
  if(hasBooking) {
    res.status(400);
    throw new Error('You already have a confirmed booking on this bus');
  }

  // Add to waiting list
  await WaitingList.create({
    user: userId,
    bus: busId,
  });

  res.status(201).json({ message: 'Successfully joined waiting list' });
});

export { createBooking, getMyBookings, cancelBooking, joinWaitingList };