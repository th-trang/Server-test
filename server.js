const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const customizeRoutes = require('./routes/customize');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorController = require('./controllers/error');
const cors = require('cors');
const WebSocket = require('ws');
const db = require('./util/database');
const dataModels = require('./models/data');

// Kết nối tới Modbus
const Modbus = require('modbus-serial');
const MODBUS_TCP_PORT = 502;
const MODBUS_TCP_IP = '192.168.30.28';

const client = new Modbus();
client.connectTCP(MODBUS_TCP_IP, { port: MODBUS_TCP_PORT }, ()=> {
  console.log('Kết nối thành công đến thiết bị Modbus.');
});

client.on('error', (err) => {
  console.error('Lỗi kết nối Modbus:', err);
});

// Hàm đọc giá trị từ Modbus và ghi vào cơ sở dữ liệu
async function readAndWriteData() {
  try {
    // Đọc giá trị từ thiết bị Modbus
    const data = await new Promise((resolve, reject) => {
      client.readHoldingRegisters(72, 36, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    let floatArray = [];
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

//    console.log('Gia tri doc duoc: ', floatArray);

    // Ghi giá trị vào cơ sở dữ liệu SQL
    const connection = await db.getConnection();
    for (let i = 0; i < floatArray.length; i++) {
      const floatValue = floatArray[i];
      let tag = '';

      // Kiểm tra giá trị của i
      if ((i >= 0 && i <= 5) || (i >= 12 && i <= 17)) {
        switch (i) {
          case 0:
            tag = '1HNE10CQ207';
            break;
          case 1:
            tag = '1HNE10CQ205';
            break;
          case 2:
            tag = '1HNE10CQ204';
            break;
          case 3:
            tag = '1HNE10CQ203';
            break;
          case 4:
            tag = '1HNE10CQ202';
            break;
          case 5:
            tag = '1HNE10CQ201';
            break;
          case 12:
              tag = '1HNECQ206';
              break;
          case 13:
            tag = '1HNECF201';
            break;
          case 14:
            tag = '1HNECP201';
            break;
          case 15:
            tag = '1HNECQ002';
            break;
          case 16:
            tag = 'T-TT0301';
            break;
          case 17:
            tag = 'T-TT0302';
            break;
          default:
            break;
        }

        // Thực hiện truy vấn chỉ với các giá trị i cụ thể
        const sql = `UPDATE data SET realtimeValue = ? WHERE tag = ?`;
        const values = [floatValue, tag];

        // Query
        await connection.query(sql, values);
//        console.log(`Cập nhật dữ liệu thành công cho tag ${tag}`);
      }
    }

    connection.release(); 
  } catch (err) {
    console.error('Error while reading modbus and writing to SQL:', err);
  }
}

//Khởi tạo ứng dụng Express
const main = express();
const ports = process.env.PORT || 3000;

main.use(bodyParser.json());
main.use(cors());
main.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,OPTIONS,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers','Origin, Accept, X-Requested-With, Content-Type');
  next();
});
main.use('/auth', authRoutes);
main.use('/dashboard', dashboardRoutes);
main.use('/customize', customizeRoutes);
main.use(errorController.get404);
main.use(errorController.get500);

// Khởi tạo máy chủ HTTP
const server = main.listen(ports, () => {
  console.log(`Server is running on port ${ports}`);
});

// Khởi tạo WebSocket server
const wss = new WebSocket.Server({ noServer: true });
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Lặp gọi hàm đọc giá trị và ghi vào cơ sở dữ liệu mỗi giây
setInterval(readAndWriteData, 1000);

