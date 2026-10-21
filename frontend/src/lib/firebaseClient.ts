export interface BetterSelfUser {
  uid: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: 'admin' | 'student';
  admin: boolean;
  token?: string;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Pre-seeded credentials documentation for user reference
export const PRE_SEEDED_ACCOUNTS = [
  {
    role: 'Lead Clinical Admin',
    email: 'admin@betterself.pk',
    password: 'Admin@12345',
    badge: 'Admin Access & CMS',
    description: 'Manage curriculum, view student directory, verify payments, and inspect stats.'
  },
  {
    role: 'Active Enrolled Student',
    email: 'active.student@betterself.pk',
    password: 'Student@12345',
    badge: '67% Progress',
    description: 'Verified student with completed lessons, private notes, and unlocked classroom.'
  },
  {
    role: 'Pending Review Student',
    email: 'pending.student@betterself.pk',
    password: 'Pending@12345',
    badge: 'Pending Review',
    description: 'Student with submitted JazzCash TID awaiting admin payment verification.'
  }
];

// Get stored session
export const getStoredUser = (): BetterSelfUser | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('betterself_auth_session');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.user || null;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('betterself_auth_session');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.token || null;
  } catch {
    return null;
  }
};

// Client Auth listener abstraction
export const subscribeToAuth = (callback: (user: BetterSelfUser | null) => void) => {
  if (typeof window === 'undefined') return () => {};

  // Initial call with stored user
  callback(getStoredUser());

  const listener = (event: StorageEvent) => {
    if (event.key === 'betterself_auth_session') {
      callback(getStoredUser());
    }
  };

  const customListener = () => {
    callback(getStoredUser());
  };

  window.addEventListener('storage', listener);
  window.addEventListener('betterself_auth_changed', customListener);

  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener('betterself_auth_changed', customListener);
  };
};

// Sign In with email & password against backend
export const signInWithCredentials = async (email: string, password: string): Promise<BetterSelfUser> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed. Please check credentials.');
  }

  const session = {
    token: data.token,
    user: data.user
  };

  localStorage.setItem('betterself_auth_session', JSON.stringify(session));
  window.dispatchEvent(new Event('betterself_auth_changed'));
  return data.user;
};

// Register a brand new student
export const registerStudent = async (name: string, email: string, password: string, phoneNumber?: string): Promise<BetterSelfUser> => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone: phoneNumber, phoneNumber })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  const session = {
    token: data.token,
    user: data.user
  };

  localStorage.setItem('betterself_auth_session', JSON.stringify(session));
  window.dispatchEvent(new Event('betterself_auth_changed'));
  return data.user;
};

// Sign Out
export const logOutUser = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('betterself_auth_session');
    window.dispatchEvent(new Event('betterself_auth_changed'));
  }
};

// Get current token for API calls
export const getCurrentAuthToken = async (): Promise<string | null> => {
  return getStoredToken();
};

// Upload helper for receipts (converts file to base64 Data URL)
export const uploadReceiptImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
