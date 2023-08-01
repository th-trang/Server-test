const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const data = require('../models/data');

// Route xử lý yêu cầu GET đến địa chỉ /dashboard
router.get('/', auth, async (req, res) => {
  try {
    const [allData] = await data.fetchAll();
    res.status(200).json(allData);
    //console.log('data', allData);
  } catch (err) {
    console.error('Error while reading modbus and writing to SQL:', err);
    res.status(500).send('Error occurred');
  }
});

// Đối với các tuyến không tồn tại, trả về trang 404.
router.use((req, res) => {
  res.status(404).send('Trang không tồn tại');
});

module.exports = router;
