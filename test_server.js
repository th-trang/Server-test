// Import các module
const express = require('express');
const ModbusRTU = require('modbus-serial');
const mysql = require('mysql2');
const WebSocket = require('ws');

// Cấu hình kết nối cơ sở dữ liệu MySQL
const dbConfig = {
  host: 'your_mysql_host',
  user: 'your_mysql_user',
  password: 'your_mysql_password',
  database: 'your_database_name'
};
const connection = mysql.createConnection(dbConfig);

// Kết nối tới modbus
const modbusClient = new ModbusRTU();
const modbusConfig = {
  port: '/dev/ttyUSB0', // Thay đổi địa chỉ port tùy theo trường hợp thực tế
  baudRate: 9600,       // Thay đổi baud rate tùy theo trường hợp thực tế
  dataBits: 8,
  stopBits: 1,
  parity: 'none'
};
modbusClient.connectRTUBuffered(modbusConfig.port, modbusConfig, onModbusConnected);

function onModbusConnected() {
  console.log('Modbus connected');
}

// Khởi tạo ứng dụng Express
const app = express();
const port = 3000;

// Định nghĩa API để đọc giá trị modbus và ghi vào cơ sở dữ liệu
app.get('/read-modbus', async (req, res) => {
  try {
    // Đọc giá trị từ modbus (ví dụ: đọc giá trị từ register 0x01)
    const value = await modbusClient.readHoldingRegisters(0x01, 1);

    // Ghi giá trị vào cơ sở dữ liệu SQL
    connection.query('INSERT INTO your_table_name (value) VALUES (?)', [value.data[0]], (err, results) => {
      if (err) throw err;
      console.log('Value inserted into SQL:', value.data[0]);
    });

    res.send('Read and written to SQL successfully');
  } catch (err) {
    console.error('Error while reading modbus and writing to SQL:', err);
    res.status(500).send('Error occurred');
  }
});

// Khởi tạo máy chủ HTTP
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Khởi tạo WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket kết nối và truyền giá trị từ SQL lên trình duyệt
wss.on('connection', ws => {
  console.log('WebSocket connected');

  // Gửi giá trị từ cơ sở dữ liệu lên trình duyệt mỗi 1 giây
  const query = connection.query('SELECT * FROM your_table_name');
  query.stream().on('data', row => {
    ws.send(JSON.stringify(row));
  });

  // Xử lý khi WebSocket đóng kết nối
  ws.on('close', () => {
    console.log('WebSocket disconnected');
  });
});
