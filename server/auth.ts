import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { db, OtpDoc, UserDoc } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'seedhamandi_super_secret_jwt_key_2026_agro';

// Secure Hashing helper
export function hashString(value: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(value).digest('hex');
}

// Generate 6-digit OTP
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// JWT Token Creation
export function createJwtToken(user: UserDoc): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    })
  ).toString('base64url');

  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

// JWT Token Verification
export function verifyJwtToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decoded;
  } catch (err) {
    return null;
  }
}

// OTP Delivery Service with Real & Fallback support
export async function sendEmailOtp(email: string): Promise<{ success: boolean; message: string; demoOtp?: string }> {
  const otp = generateOtp();
  const otpHash = hashString(otp);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const otpDoc: OtpDoc = {
    id: 'otp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    identifier: email.toLowerCase().trim(),
    otpHash,
    plainOtpForPreview: otp, // Keeping in DB just for debugging, but not sending to client
    type: 'EMAIL',
    expiresAt,
    verified: false,
    createdAt: Date.now(),
  };
  db.saveOtp(otpDoc);

  // If real Gmail SMTP credentials are configured:
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_APP_PASSWORD;

  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      // Dispatch real email in background without blocking the UI response
      transporter.sendMail({
        from: `"SeedhaMandi" <${emailUser}>`,
        to: email,
        subject: 'Your SeedhaMandi Login OTP',
        text: `Your OTP for SeedhaMandi login is: ${otp}. It is valid for 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Welcome to SeedhaMandi</h2>
            <p>Your one-time password (OTP) for login is:</p>
            <h1 style="color: #16a34a; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
            <p>This code is valid for 10 minutes. Do not share this code with anyone.</p>
          </div>
        `,
      }).then(() => {
        console.log(`[REAL EMAIL] Sent OTP to ${email} via Gmail SMTP.`);
      }).catch((err: any) => {
        console.error('[SMTP ERROR] Failed to send real email OTP:', err);
      });
    } catch (err: any) {
      console.error('[SMTP ERROR] Failed to initialize email transporter:', err);
    }
  }

  // Instant response so OTP verification modal displays without any delay
  const isDemoDisabled = process.env.DEMO_OTP === 'false';
  return {
    success: true,
    message: emailUser && emailPass
      ? `OTP dispatched to ${email}. Check your inbox.`
      : `Verification code generated for ${email} (Demo Mode).`,
    demoOtp: isDemoDisabled ? undefined : otp,
  };
}

export async function sendSmsOtp(phone: string): Promise<{ success: boolean; message: string; demoOtp?: string }> {
  const otp = generateOtp();
  const otpHash = hashString(otp);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  const otpDoc: OtpDoc = {
    id: 'otp_sms_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    identifier: phone.trim(),
    otpHash,
    plainOtpForPreview: otp,
    type: 'SMS',
    expiresAt,
    verified: false,
    createdAt: Date.now(),
  };
  db.saveOtp(otpDoc);

  const isDemoDisabled = process.env.DEMO_OTP === 'false';

  return {
    success: true,
    message: isDemoDisabled
      ? `OTP generation recorded (Real dispatch skipped).`
      : `OTP generated successfully (Demo Mode)`,
    demoOtp: isDemoDisabled ? undefined : otp,
  };
}

export function verifyOtp(identifier: string, type: 'EMAIL' | 'SMS' | 'PASSWORD_RESET', enteredOtp: string): { success: boolean; message: string } {
  const record = db.getValidOtp(identifier.trim().toLowerCase(), type);
  if (!record) {
    // Check if phone format without country code was used
    const altRecord = db.getValidOtp(identifier.trim(), type);
    if (altRecord) {
      const hashedInput = hashString(enteredOtp.trim());
      if (altRecord.otpHash === hashedInput) {
        db.markOtpVerified(altRecord.id);
        return { success: true, message: 'OTP verified successfully.' };
      }
    }
    return { success: false, message: 'OTP has expired or does not exist. Please request a new code.' };
  }

  const hashedInput = hashString(enteredOtp.trim());
  if (record.otpHash !== hashedInput) {
    return { success: false, message: 'Invalid OTP entered. Please check and try again.' };
  }

  db.markOtpVerified(record.id);
  return { success: true, message: 'OTP verified successfully.' };
}
