import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { errors } from 'celebrate';

import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/authenticate.js';

import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

export const startServer = async () => {
  try {
    await connectMongoDB();

    const app = express();

    app.use(logger);
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());

    app.use('/auth', authRoutes);
    app.use('/notes', authenticate, noteRoutes);

    app.use(notFoundHandler);
    app.use(errors());
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
};