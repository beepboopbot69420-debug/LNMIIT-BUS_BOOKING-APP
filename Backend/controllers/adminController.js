import asyncHandler from 'express-async-handler';
import Bus from '../models/busModel.js';
import Booking from '../models/bookingModel.js';
import User from '../models/userModel.js';
import WaitingList from '../models/waitingListModel.js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalBuses = await Bus.countDocuments();
  const totalBookings = await Booking.countDocuments({ status: 'confirmed' });
  const totalWaiting = await WaitingList.countDocuments();
  
  const capacityData = await Bus.aggregate([
    { $group: { _id: null, totalCapacity: { $sum: "$totalSeats" } } }
  ]);
  
  const totalCapacity = capacityData.length > 0 ? capacityData[0].totalCapacity : 0;
  const occupancyRate = totalCapacity > 0 ? ((totalBookings / totalCapacity) * 100).toFixed(1) : 0;

  res.json({
    totalBuses,
    totalBookings,
    totalWaiting,
    totalCapacity,
    occupancyRate
  });
});

// @desc    Download booking report
// @route   GET /api/admin/report
// @access  Private (Admin)
const downloadReport = asyncHandler(async (req, res) => {
  const { format = 'pdf' } = req.query; // 'pdf' or 'csv'

  const bookings = await Booking.find({ status: 'confirmed' })
    .populate('user', 'name email')
    .populate('bus', 'busNumber route');
    
  const data = bookings.map(b => ({
    bookingId: b._id.toString(),
    userName: b.user ? b.user.name : 'N/A',
    userEmail: b.user ? b.user.email : 'N/A',
    busNumber: b.bus ? b.bus.busNumber : b.busNumber,
    route: b.bus ? b.bus.route : b.route,
    seatNumber: b.seatNumber,
    bookingDate: new Date(b.bookingDate).toLocaleDateString(),
  }));

  if (format === 'pdf') {
    const doc = new jsPDF();
    
    doc.text('LNMIIT Bus Booking Report', 20, 10);
    doc.autoTable({
      head: [['Booking ID', 'Student', 'Email', 'Bus', 'Route', 'Seat', 'Date']],
      body: data.map(Object.values),
    });
    
    const pdfBuffer = doc.output('arraybuffer');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=booking_report.pdf');
    res.send(Buffer.from(pdfBuffer));

  } else { // CSV
    const csv = Papa.unparse(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=booking_report.csv');
    res.send(csv);
  }
});

export { getDashboardStats, downloadReport };