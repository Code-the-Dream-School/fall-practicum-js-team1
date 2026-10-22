import express from 'express';
import { getHello } from '../controllers/hello.controller.js';

const router = express.Router();
// GET /api/hello
router.get('/', getHello);

export default router;
