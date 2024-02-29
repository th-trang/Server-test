const express = require('express');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const customizeRoutes = require('./routes/customize');
const dashboardRoutes = require('./routes/dashboard');
const trendRoutes = require('./routes/trend');
const errorController = require('./controllers/error');
const cors = require('cors');
const db = require('./util/database');
const data = require('./models/data');
const histories = require('./models/histories')
const Modbus = require('modbus-serial');


// Kết nối tới Modbus
const MODBUS_TCP_PORT = 502;
const MODBUS_TCP_IP = '192.168.1.180';
const registerData = 72;
const registerStatus = 154;
const numberofRegister = 24;//số thanh ghi luôn chẵn
const socketEmitInterval = 1000;//milliseconds
let isModbusConnected = false;

const tagMap = {
  0: '1HNE10CQ207',
  1: '1HNE10CQ205',
  2: '1HNE10CQ204',
  3: '1HNE10CQ203',
  4: '1HNE10CQ202',
  5: '1HNE10CQ201',
  12: '1HNECQ206',
  13: '1HNECF201',
  14: '1HNECP201',
  15: '1HNECQ002',
  16: 'T-TT0301',
  17: 'T-TT0302'
};

const client = new Modbus();

function connectModbus() {
  client.connectTCP(MODBUS_TCP_IP, { port: MODBUS_TCP_PORT }, async () => {
    console.log('Connected Modbus device.');
    isModbusConnected = true;
  });
}

function getStatusText(floatStatus) {
  if (floatStatus == 0) {
    return 'Normal';
  } else if (floatStatus == 1) {
    return 'Calib';
  } else if (floatStatus >= 2) {
    return 'Error';
  } else {
    return 'Unknown';
  }
}


// Hàm đọc giá trị từ Modbus và ghi vào cơ sở dữ liệu
async function readAndWriteData() {
  try {
    // Đọc giá trị từ thiết bị Modbus
    const data = await new Promise((resolve, reject) => {
      client.readHoldingRegisters(registerData, numberofRegister, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    // Read measured status: Status register
    const status = await new Promise((resolve, reject) => {
      client.readHoldingRegisters(registerStatus, numberofRegister, (err, status) => {
        if (err) {
          reject(err);
        } else {
          resolve(status);
        }
      });
    });

    let floatArrayData = [];
    for (let i = 0; i < numberofRegister - 1; i += 2) {
      const highByteData = data.data[i];
      const lowByteData = data.data[i + 1];
      const combinedValueData = (highByteData << 16) | lowByteData;
      const bufferData = Buffer.alloc(4);
      bufferData.writeInt32BE(combinedValueData, 0);
      const floatValueData = bufferData.readFloatBE(0);
      const roundedValueData = floatValueData.toFixed(2);
      floatArrayData.push(roundedValueData);
    }

    
    let floatArrayStatus = [];
    for (let i = 0; i < numberofRegister - 1; i += 2) {
      const highByteStatus = status.data[i];
      const lowByteStatus = status.data[i + 1];
      const combinedValueStatus = (highByteStatus << 16) | lowByteStatus;
      const bufferStatus = Buffer.alloc(4);
      bufferStatus.writeInt32BE(combinedValueStatus, 0);
      const floatValueStatus = bufferStatus.readFloatBE(0);
      const roundedValueStatus = floatValueStatus.toFixed(2);
      floatArrayStatus.push(roundedValueStatus);
    }

    let statusArrayText = [];
    for (let i = 0; i < numberofRegister /2; i++){
      statusArrayText[i] =  getStatusText(floatArrayStatus[i]);
    }

    const connection = await db.getConnection();
    for (let i = 0; i < numberofRegister /2; i++) {
      const floatData = floatArrayData[i];
      const statusText = statusArrayText[i];
      const tag = tagMap[i];
      const sql = `UPDATE data SET realtimeValue = ?, status = ?, time = NOW() WHERE tag = ?`;
      const values = [floatData, statusText, tag];
      await connection.query(sql, values);
    }
    
    const insertSql = `
      INSERT INTO histories
      (stack_flow, status1, stack_pressure, status2, gas_o2, status3, gas_co, status4, gas_nox, status5, gas_so2, status6,
      gas_hcl, status7, stack_dust, status8, gas_h2o, status9, stack_temp, status10, temp_furnance301, status11, temp_furnance302, status12)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertValues = [
      floatArrayData[0], statusArrayText[0], floatArrayData[1], statusArrayText[1],
      floatArrayData[2], statusArrayText[2], floatArrayData[3], statusArrayText[3],
      floatArrayData[4], statusArrayText[4], floatArrayData[5], statusArrayText[5],
      floatArrayData[6], statusArrayText[6], floatArrayData[7], statusArrayText[7],
      floatArrayData[8], statusArrayText[8], floatArrayData[9], statusArrayText[9],
      floatArrayData[10], statusArrayText[10], floatArrayData[11], statusArrayText[11]
    ];
    await connection.query(insertSql, insertValues);

    connection.release();
  } catch (err) {
    console.error('Error while reading modbus and writing to SQL:', err);
    isModbusConnected = false;
    connectModbus();
  }
}

const main = express();
const ports = process.env.PORT || 3000;

main.use(bodyParser.json());
main.use(cors());

main.use('/auth', authRoutes);
main.use('/dashboard', dashboardRoutes);
main.use('/customize', customizeRoutes);
main.use('/trend', trendRoutes);
main.use(errorController.get404);
main.use(errorController.get500);

const server = main.listen(ports, () => {
  console.log(`Server running on:  http://localhost:${ports}`);
});

const io = socketIo(server, {
  cors: {
    origin: '*', // Allow requests from any origin (change this to restrict access if needed)
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

io.on('connection', (socket) => {
  console.log('WebSocket Connected.');

  setInterval(async () => {
    try {
      const [allData] = await data.fetchAll();
      const [allStat] = await histories.fetchStat();
      socket.emit('data', allData);
      socket.emit('stat', allStat);
    } catch (err) {
      console.error('Error while querying data from SQL:', err);
    }
  }, 1000);
});

connectModbus();
setInterval(readAndWriteData, 10000);
