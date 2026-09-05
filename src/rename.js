import express from 'express';
import cors from 'cors';
import pino from 'pino-http';
import dotenv from 'dotenv';

dotenv.config();

export const startServer = () => {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Standard Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(pino());

  // Routes
  app.get('/notes', (req, res) => {
    res.status(200).json({
      message: 'Retrieved all notes',
    });
  });

  app.get('/notes/:noteId', (req, res) => {
    const { noteId } = req.params;
    res.status(200).json({
      message: `Retrieved note with ID: ${noteId}`,
    });
  });

  app.get('/test-error', () => {
    throw new Error('Simulated server error');
  });

  // 404 Middleware (Handle unknown routes)
  app.use((req, res) => {
    res.status(404).json({
      message: 'Route not found',
    });
  });

  // 500 Middleware (Error Handler)
  app.use((err, req, res, next) => {
    res.status(500).json({
      message: err.message || 'Something went wrong',
    });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};