import express from 'express';
import notificationsHandler from '../../api/notifications.js';
const router = express.Router();
router.all('/', notificationsHandler);
export default router;
