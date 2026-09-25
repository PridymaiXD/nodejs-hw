import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';

const createSessionData = (userId) => {
  const accessToken = crypto.randomBytes(30).toString('base64');
  const refreshToken = crypto.randomBytes(30).toString('base64');

  return {
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 мин
    refreshTokenValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
  };
};

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createHttpError(409, 'Email in use'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      status: 201,
      message: 'Successfully registered a user!',
      data: userObj,
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(createHttpError(401, 'Email or password invalid'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createHttpError(401, 'Email or password invalid'));
    }

    await Session.deleteOne({ userId: user._id });

    const session = await Session.create(createSessionData(user._id));

    res.cookie('refreshToken', session.refreshToken, {
      httpOnly: true,
      expires: session.refreshTokenValidUntil,
    });
    res.cookie('sessionId', session._id, {
      httpOnly: true,
      expires: session.refreshTokenValidUntil,
    });

    res.status(200).json({
      status: 200,
      message: 'Successfully logged in an user!',
      data: {
        accessToken: session.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }

    res.clearCookie('sessionId');
    res.clearCookie('refreshToken');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;

    if (!sessionId || !refreshToken) {
      return next(createHttpError(401, 'Session or refresh token missing'));
    }

    const session = await Session.findOne({ _id: sessionId, refreshToken });

    if (!session) {
      return next(createHttpError(401, 'Session not found'));
    }

    const isSessionTokenExpired = new Date() > new Date(session.refreshTokenValidUntil);

    if (isSessionTokenExpired) {
      await Session.deleteOne({ _id: sessionId });

      res.clearCookie('sessionId');
      res.clearCookie('refreshToken');

      return next(createHttpError(401, 'Refresh token expired'));
    }

    await Session.deleteOne({ _id: sessionId });

    const newSession = await Session.create(createSessionData(session.userId));

    res.cookie('refreshToken', newSession.refreshToken, {
      httpOnly: true,
      expires: newSession.refreshTokenValidUntil,
    });
    res.cookie('sessionId', newSession._id, {
      httpOnly: true,
      expires: newSession.refreshTokenValidUntil,
    });

    res.status(200).json({
      status: 200,
      message: 'Successfully refreshed a session!',
      data: {
        accessToken: newSession.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};