const express = require('express');
const router = express.Router();
const { getRefillRequests, updateRefillStatus, createRefillRequest } = require('../controllers/refillController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.route('/')
  .get(getRefillRequests)
  .post(createRefillRequest);

router.route('/:id')
  .patch(updateRefillStatus);

module.exports = router;
