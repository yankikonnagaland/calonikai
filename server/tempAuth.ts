// Server-side device fingerprint authentication middleware
import { Request, Response, NextFunction } from 'express';

export interface TempAuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

export const verifyTempAuth = async (req: TempAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for Firebase token first
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      // Let Firebase middleware handle this
      return next();
    }

    // Check for device fingerprint auth
    const deviceAuth = req.headers['x-device-auth'] as string;
    if (!deviceAuth || !deviceAuth.startsWith('device_')) {
      return res.status(401).json({ message: "Unauthorized - No valid authentication" });
    }

    // Validate device ID format (basic security check)
    if (!/^device_[a-zA-Z0-9]+$/.test(deviceAuth)) {
      return res.status(401).json({ message: "Unauthorized - Invalid device ID format" });
    }

    // Set user object for device fingerprint auth
    req.user = {
      uid: deviceAuth,
      email: `${deviceAuth}@temp.local`,
      name: 'Device User'
    };

    next();
  } catch (error) {
    console.error("Temp auth error:", error);
    res.status(401).json({ message: "Unauthorized - Authentication failed" });
  }
};

// Combined auth middleware that tries Firebase first, then device fingerprint
export const verifyAuth = async (req: TempAuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const deviceAuth = req.headers['x-device-auth'];

  if (authHeader?.startsWith('Bearer ')) {
    // Try Firebase auth
    try {
      const { verifyFirebaseToken } = await import('./firebaseAuth');
      return verifyFirebaseToken(req, res, next);
    } catch (error) {
      // Firebase failed, fall back to device auth
    }
  }

  // Use device fingerprint auth
  return verifyTempAuth(req, res, next);
};