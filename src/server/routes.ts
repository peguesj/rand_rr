import express from 'express';
import { jobProcessHandler } from './handlers/jobProcess';
import { finesseHandler } from './handlers/finesse';
import { logger } from '../utils/logger';

const router = express.Router();

router.post('/api/job-process', async (req, res) => {
  logger.info('Received job processing request');
  try {
    const result = await jobProcessHandler(req.body.content);
    res.json(result);
  } catch (error) {
    logger.error('Job processing failed', { error });
    res.status(500).json({ error: 'Job processing failed' });
  }
});

router.post('/api/finesse', async (req, res) => {
  logger.info('Received finesse request', { exactRole: req.body.exactRole });
  try {
    const result = await finesseHandler(req.body.content, req.body.exactRole);
    res.json(result);
  } catch (error) {
    logger.error('Finesse processing failed', { error });
    res.status(500).json({ error: 'Finesse processing failed' });
  }
});

export default router;
