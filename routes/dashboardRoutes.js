const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const data = require('../models/data');

// Thêm WebSocket để sử dụng trong tệp dashboardRoutes.js
const expressWs = require('express-ws')(router); // Initialize express-ws with router

// Route xử lý yêu cầu GET đến địa chỉ /dashboard
router.get('/', auth, async (req, res) => {
  try {
    const [allData] = await data.fetchAll();
    //Trả về HTTP respone cho yêu cầu GET /dashboard
    res.status(200).json(allData);
  } catch (err) {
    console.error('Error while reading modbus and writing to SQL:', err);
    res.status(500).send('Error occurred');
  }
});

// Kết nối WebSocket khi máy khách yêu cầu
router.ws('/', auth, (ws, req) => {
  console.log('Client request connect WebSocket!')
  // Gửi dữ liệu từ SQL cho máy khách khi kết nối WebSocket được thiết lập
  data.fetchAll()
    .then(([allData]) => {
      ws.send(JSON.stringify(allData));
    })
    .catch((err) => {
      console.error('Error while reading modbus and writing to SQL:', err);
    });
  
  // Update WebSocket clients with new data when available
  const updateClients = (newData) => {
    ws.send(JSON.stringify(newData));
    console.log('Dữ liệu gửi đi cho máy khách:', newData);
  };
});

// Đối với các tuyến không tồn tại, trả về trang 404.
router.use((req, res) => {
  res.status(404).send('Trang không tồn tại');
});

module.exports = router;
