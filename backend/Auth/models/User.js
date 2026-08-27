const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@gmail\.com$/i, 'Email must be a valid @gmail.com address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['student', 'canteen', 'admin'],
      required: [true, 'Role is required'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    // Admin-specific fields
    nic: {
      type: String,
      trim: true,
      default: '',
    },
    // Student-specific fields
    university: {
      type: String,
      trim: true,
      default: '',
    },
    studentId: {
      type: String,
      trim: true,
      default: '',
    },
    // Canteen-specific fields
    canteenName: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
   isBlocked: {
  type: Boolean,
  default: false,
},
status: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: function() {
    return this.role === 'canteen' ? 'pending' : 'approved';
  },
},
registrationDocument: {
  type: String, // stores file path
  default: '',
},
rejectionReason: {
  type: String,
  default: '',
},
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
