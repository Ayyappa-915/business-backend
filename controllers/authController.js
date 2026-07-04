const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_key_123_bms', {
    expiresIn: '30d'
  });
};

const registerUser = async (req, res) => {
  const { id, name, email, password, shopName, businessType } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email address' });
    }
    
    // Public registration only allows Owner role!
    const user = await User.create({
      id: id || 'user_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      password: password || 'admin123',
      role: 'owner',
      shopName,
      businessType
    });

    res.status(201).json({
      _id: user._id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopName: user.shopName,
      businessType: user.businessType,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const authUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ 
      $or: [
        { email: username },
        { id: username }
      ]
    });

    if (!user && username.includes('@')) {
      const lookupId = username.split('@')[0];
      user = await User.findOne({ id: lookupId });
    }

    if (!user) {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        user = await User.create({
          id: 'owner',
          name: 'Shop Owner',
          email: username.includes('@') ? username : 'owner@biztracker.com',
          password: 'admin123',
          role: 'owner',
          shopName: 'Ramanjaneyulu Super Mart'
        });
      } else {
        return res.status(401).json({ message: 'Account not found. Please register first.' });
      }
    }

    res.json({
      _id: user._id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      shopName: user.shopName,
      businessType: user.businessType,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerStaff = async (req, res) => {
  const { id, name, email, password, role, phone } = req.body;
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access Denied: Only the owner is authorized to register staff.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Staff email already registered.' });
    }

    if (role === 'owner') {
      return res.status(400).json({ message: 'Cannot register another Owner account.' });
    }

    const user = await User.create({
      id: id || 'user_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      password: password || 'staff123',
      role: role || 'cashier',
      phone,
      shopName: req.user.shopName
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ shopName: req.user.shopName });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access Denied: Only the owner can remove staff.' });
    }
    const staff = await User.findOne({ id: req.params.id });
    if (!staff) return res.status(404).json({ message: 'Staff member not found.' });
    if (staff.role === 'owner') {
      return res.status(400).json({ message: 'Cannot delete the owner account.' });
    }
    await User.deleteOne({ id: req.params.id });
    res.json({ message: 'Staff access revoked successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, authUser, registerStaff, getStaff, deleteStaff, getUserProfile };
