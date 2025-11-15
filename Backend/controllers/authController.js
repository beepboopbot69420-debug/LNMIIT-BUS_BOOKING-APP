import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  // --- THIS IS THE FIX ---
  // We destructure the variables sent from the frontend
  // and rename them to match our database model (e.g., signupName becomes name)
  const {
    signupName: name,
    signupEmail: email,
    signupPassword: password,
    signupConfirmPassword,
  } = req.body;

  if (!name || !email || !password || !signupConfirmPassword) {
    res.status(400);
    throw new Error('Please fill in all fields');
  }
  // --- END OF FIX ---

  if (password !== signupConfirmPassword) {
    res.status(400);
    throw new Error('Passwords do not match');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: email === 'admin@lnmiit.ac.in' ? 'admin' : 'student', // Simple admin assignment
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Check for user
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

export { registerUser, loginUser };