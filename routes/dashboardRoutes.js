const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/', auth, dashboardController.fetchAll);

router.put('/', auth, dashboardController.updateExpectedData);

// Đối với các tuyến không tồn tại, trả về trang 404.
router.use((req, res) => {
  res.status(404).send('Trang không tồn tại');
});

module.exports = router;
