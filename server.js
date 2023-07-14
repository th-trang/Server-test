const Modbus = require('modbus-serial');
const express = require('express');
const bodyParser = require('body-parser')
const authRoutes = require('./routes/auth')
const customizeRoutes = require('./routes/customize')
const dashboardRoutes = require('./routes/dashboard')
const errorController = require('./controllers/error')
const cors = require('cors')
const databaseUtil = require('./util/database');

const main = express();

const init = async () => {
  try {
    // Khởi tạo kết nối cơ sở dữ liệu
    await databaseUtil.pool;
    console.log('Kết nối cơ sở dữ liệu thành công');

    // Chèn dữ liệu ban đầu vào cơ sở dữ liệu
    databaseUtil.insertInitialValuesToData();
    databaseUtil.insertInitialValuesToUsers();

    main.use(bodyParser.json())
    main.use(cors())
    main.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin','*')
      res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS,POST,PUT')
      res.setHeader('Access-Control-Allow-Headers','Origin, Accept, X-Requested-With, Content-Type')
      next()
    });

    main.use('/auth', authRoutes);
    main.use('/dashboard', dashboardRoutes);
    main.use('/customize', customizeRoutes);
    main.use(errorController.get404);
    main.use(errorController.get500);

    // Khởi động máy chủ
    const port = process.env.PORT || 3000;
    main.listen(port, () => {
      console.log(`Máy chủ đang lắng nghe tại cổng ${port}`);
    });
  } catch (error) {
    console.error('Lỗi khi khởi chạy ứng dụng:', error);
  }
};


// Kết nối tới thiết bị Modbus
const client = new Modbus();
const MODBUS_TCP_PORT = 502;
const MODBUS_TCP_IP = '192.168.100.5';//Thay đổi địa chỉ IP theo thiết bị kết nối
//IP Dlogger: 192.168.1.5
//IP VMM Simulation: 192.168.30.41

client.connectTCP(MODBUS_TCP_IP, { port: MODBUS_TCP_PORT }, () => {
  // console.log('Kết nối thành công đến thiết bị Modbus.');
});

client.on('error', (err) => {
  console.error('Lỗi kết nối Modbus:', err);
});

// Gửi dữ liệu từ thiết bị Modbus mỗi giây
const interval = setInterval(() => {
  client.readHoldingRegisters(72, 36, (err, data) => {
    // Xử lý dữ liệu đọc từ thiết bị Modbus
    if (err) {
      console.error('Lỗi khi đọc dữ liệu từ thiết bị Modbus:', err);
    } else {
      const floatArray = [];
      for (let i = 0; i < data.data.length - 1; i += 2) {
        const highByte = data.data[i];
        const lowByte = data.data[i + 1];
        const combinedValue = (highByte << 16) | lowByte;
        const buffer = Buffer.alloc(4);
        buffer.writeInt32BE(combinedValue, 0);
        const floatValue = buffer.readFloatBE(0);
        const roundedValue = floatValue.toFixed(2);
        floatArray.push(roundedValue);
      }
    //  const lastFloatValue = floatArray[floatArray.length - 1];
      // console.log('Gia tri doc duoc: ', floatArray);

      databaseUtil.insertFloatValue(floatArray);
      // Sử dụng giá trị floatValue cuối cùng
    }
  });
}, 1000); // Gửi dữ liệu từ thiết bị Modbus mỗi giây

// Khởi chạy ứng dụng
init();
