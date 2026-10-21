import { db } from '../config/firebaseAdmin.js';

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const snap = await db.collection('users')
      .where('email', '==', cleanEmail)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userDoc = snap.docs[0];
    const user = userDoc.data();

    // Check password
    if (user.password !== password.trim()) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isAdmin = user.role === 'admin' || cleanEmail.includes('admin@betterself.pk');
    const token = `mock-token-custom:${user.uid}:${cleanEmail}:${isAdmin}`;

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        uid: user.uid,
        email: cleanEmail,
        name: user.name || 'User',
        phoneNumber: user.phoneNumber || user.phone || '',
        role: user.role || 'student',
        admin: isAdmin
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Authentication failed',
      details: err.message
    });
  }
};

// POST /api/auth/register
export const register = async (req, res) => {
  const { name, email, password, phone, phoneNumber } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name || cleanEmail.split('@')[0]).trim();
  const cleanPhone = (phone || phoneNumber || '').trim();

  try {
    const existingSnap = await db.collection('users')
      .where('email', '==', cleanEmail)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const uid = `u_student_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
    const newUser = {
      uid,
      email: cleanEmail,
      name: cleanName,
      phoneNumber: cleanPhone,
      password: password.trim(),
      role: 'student',
      createdAt: new Date().toISOString()
    };

    await db.collection('users').doc(uid).set(newUser);

    const token = `mock-token-custom:${uid}:${cleanEmail}:false`;

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        uid,
        email: cleanEmail,
        name: cleanName,
        phoneNumber: cleanPhone,
        role: 'student',
        admin: false
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Registration failed',
      details: err.message
    });
  }
};

// GET /api/auth/me (verifyFirebaseToken)
export const getMe = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      return res.status(200).json({
        user: {
          uid: req.user.uid,
          email: data.email,
          name: data.name,
          phoneNumber: data.phoneNumber || data.phone || '',
          role: data.role || (req.user.admin ? 'admin' : 'student'),
          admin: Boolean(req.user.admin)
        }
      });
    }

    return res.status(200).json({
      user: {
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name || 'Learner',
        phoneNumber: req.user.phoneNumber || req.user.phone || '',
        role: req.user.admin ? 'admin' : 'student',
        admin: Boolean(req.user.admin)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile', details: err.message });
  }
};
