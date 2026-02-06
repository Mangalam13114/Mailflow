import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import config from '../config/env';

// ================================
// TYPES
// ================================
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

// ================================
// GOOGLE AUTH CONTROLLER
// ================================

// Google OAuth URLs
const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

class AuthController {
  /**
   * Redirect to Google OAuth
   * GET /api/auth/google
   */
  async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
      
      const params = new URLSearchParams({
        client_id: config.googleClientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
      });

      const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('Google login error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate Google login',
      });
    }
  }

  /**
   * Google OAuth Callback
   * GET /api/auth/google/callback
   */
    /**
   * Google OAuth Callback
   * GET /api/auth/google/callback
   */
  async googleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        res.redirect(`${config.frontendUrl}/login?error=no_code`);
        return;
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

      // Exchange code for tokens
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.googleClientId,
          client_secret: config.googleClientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokenJson = await tokenResponse.json();
      const tokenData = tokenJson as GoogleTokenResponse;

      if (!tokenResponse.ok || tokenData.error) {
        console.error('Token exchange failed:', tokenData);
        res.redirect(`${config.frontendUrl}/login?error=token_failed`);
        return;
      }

      // Get user info from Google
      const userResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const userJson = await userResponse.json();
      const userData = userJson as GoogleUserInfo;

      if (!userResponse.ok || !userData.email) {
        console.error('User info fetch failed:', userData);
        res.redirect(`${config.frontendUrl}/login?error=userinfo_failed`);
        return;
      }

      // Create or update user in database
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          avatar: userData.picture || null,
        },
        create: {
          email: userData.email,
          name: userData.name,
          avatar: userData.picture || null,
        },
      });

      // Create JWT token
      const jwtToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      // Set cookie and redirect to frontend
      res.cookie('token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log(`✅ User logged in: ${user.email}`);
      
      res.redirect(`${config.frontendUrl}/dashboard`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${config.frontendUrl}/login?error=callback_failed`);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      // Verify JWT
      const decoded = jwt.verify(token, config.jwtSecret) as {
        id: string;
        email: string;
        name: string;
      };

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to logout',
      });
    }
  }
}

export default new AuthController();