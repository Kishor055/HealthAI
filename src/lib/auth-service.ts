
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

/**
 * Custom Auth Service for managing Email OTPs and Session logs.
 */
export const AuthService = {
  /**
   * Generates a 6-digit OTP and stores it in Firestore for server-side verification.
   */
  async dispatchEmailOTP(email: string) {
    const db = getFirestore();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await addDoc(collection(db, 'otp_logs'), {
      email,
      otp, // In production, this should be hashed
      type: 'email',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      createdAt: serverTimestamp(),
      used: false,
    });

    // Note: Here you would normally trigger a Cloud Function to send the email via SendGrid/Resend
    console.log(`[AUTH] Dispatched OTP ${otp} to ${email}`);
    return true;
  },

  /**
   * Verifies an OTP against the Firestore log.
   */
  async verifyEmailOTP(email: string, otp: string) {
    const db = getFirestore();
    const q = query(
      collection(db, 'otp_logs'),
      where('email', '==', email),
      where('otp', '==', otp),
      where('used', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;

    // Additional expiry check logic here
    return true;
  }
};
