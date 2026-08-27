const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/User');

// ── Multer setup for registration documents ───────────────────────────────────
const storage = multer.memoryStorage(); // ← memory, not disk
const uploadDoc = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF, JPG, and PNG files are allowed'));
  },
});

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { name, email, password, role, phone, university, studentId, canteenName, location, licenseNumber } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, password, and role',
            });
        }

        // Normalize
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedRole  = role.toLowerCase().trim();

        if (!/^[^\s@]+@gmail\.com$/i.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Email must be a valid @gmail.com address',
            });
        }

        // Check valid role
        if (!['student', 'canteen', 'admin'].includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be student, canteen, or admin',
            });
        }

        // ✅ Check if user already exists — normalized email
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists',
            });
        }

        // Canteen must upload a registration document
        if (normalizedRole === 'canteen' && !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Registration document is required for canteen registration',
            });
        }

        // Create user object
        const userData = { name, email: normalizedEmail, password, role: normalizedRole, phone };

        // Add role-specific fields
        if (normalizedRole === 'student') {
            userData.university = university || '';
            userData.studentId = studentId || '';
        } else if (normalizedRole === 'canteen') {
            if (!canteenName) {
                return res.status(400).json({
                    success: false,
                    message: 'Canteen name is required for canteen registration',
                });
            }
            userData.canteenName = canteenName;
            userData.location = location || '';
            userData.licenseNumber = licenseNumber || '';
            userData.registrationDocument = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }

        const user = await User.create(userData);

        // Don't return token for canteen — they must wait for approval
        if (normalizedRole === 'canteen') {
            return res.status(201).json({
                success: true,
                message: 'Registration submitted! Awaiting admin approval.',
            });
        }

        const token = generateToken(user._id);
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists',
            });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
            });
        }
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
        });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, password, and role',
            });
        }

        // ✅ Normalize email and role — fixes case-mismatch login failures
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedRole  = role.toLowerCase().trim();

        if (!/^[^\s@]+@gmail\.com$/i.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Email must be a valid @gmail.com address',
            });
        }

        // Find user by normalized email AND role
        const user = await User.findOne({ email: normalizedEmail, role: normalizedRole });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password for this role',
            });
        }

        // Block pending canteens
        if (user.role === 'canteen' && user.status === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Your canteen registration is pending admin approval.',
            });
        }

        // Block rejected canteens
        if (user.role === 'canteen' && user.status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: `Your canteen registration was rejected. Reason: ${user.rejectionReason || 'Contact admin.'}`,
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Contact admin.',
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password for this role',
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
        });
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const { name, phone, university, studentId, canteenName, location, licenseNumber } = req.body;

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;

        if (user.role === 'student') {
            if (university !== undefined) user.university = university;
            if (studentId !== undefined) user.studentId = studentId;
        }

        if (user.role === 'canteen') {
            if (canteenName) user.canteenName = canteenName;
            if (location !== undefined) user.location = location;
            if (licenseNumber !== undefined) user.licenseNumber = licenseNumber;
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new passwords',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
            });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    uploadDoc,
};
