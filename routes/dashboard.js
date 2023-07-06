const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const auth = require('../middleware/auth')

router.get('/', auth, dashboardController.fetchAll);

router.post(
  '/',
  [
    auth,
    body('tag').trim().not().isEmpty(),
    body('name').trim().isLength({ max: 15 }),
    body('expectedValue'),
    body('realtimeValue'),
    body('unit').trim(),
    body('designP').trim(),
    body('upperbound').trim(),
    body('lowerbound').trim()
  ],
  dashboardController.postData,
);

router.put("/", auth, dashboardController.updateData)

module.exports = router;