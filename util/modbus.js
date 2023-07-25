const Modbus = require('modbus-serial');
const EvenEmitter = require('events');
const Data = require('../models/data');

// Thiết lập thông tin kết nối Modbus
const MODBUS_TCP_PORT = 502;
const MODBUS_TCP_IP = '192.168.30.28';

// Tạo một client Modbus
const client = new Modbus();

// Kế thừa EvenEmitter để sử dụng các phương thức 'on' và 'emit'
class ModbusUtil extends EvenEmitter {
  constructor() {
    super();
    this.floatArray = []; // Khởi tạo floatArray
    this.isModbusConnected = false;//Trạng thái kết nối Modbus 
  }

  // Hàm đọc giá trị float từ thiết bị Modbus
  readModbusValues() {
    if (!this.isModbusConnected){
      console.error('Modbus disconnected!');
      return;
    }
    client.readHoldingRegisters(72, 36, (err, data) => {
      if (err) {
        console.error('Lỗi khi đọc dữ liệu từ thiết bị Modbus:', err);
      } else {
        this.floatArray = [];
        for (let i = 0; i < data.data.length - 1; i += 2) {
          const highByte = data.data[i];
          const lowByte = data.data[i + 1];
          const combinedValue = (highByte << 16) | lowByte;
          const buffer = Buffer.alloc(4);
          buffer.writeInt32BE(combinedValue, 0);
          const floatValue = buffer.readFloatBE(0);
          const roundedValue = floatValue.toFixed(2);
          this.floatArray.push(roundedValue);
        }
        console.log('Gia tri doc duoc: ', this.floatArray);
        Data.insertModbusValue(this.floatArray);

        // Gửi sự kiện 'newData' với dữ liệu mới nhận được từ Modbus
        this.emit('newData', this.floatArray);
      }
    });
  }

  // Hàm kết nối và đọc giá trị float từ thiết bị Modbus
  connectAndReadModbusValues() {
    client.connectTCP(MODBUS_TCP_IP, { port: MODBUS_TCP_PORT }, () => {
      console.log('Kết nối thành công đến thiết bị Modbus.');
      this.isModbusConnected = true;
      // Đọc giá trị float từ thiết bị Modbus một lần
      this.readModbusValues();
      // Đọc giá trị float từ thiết bị Modbus sau mỗi giây
      setInterval(() => this.readModbusValues(), 1000);
    });

    client.on('error', (err) => {
      console.error('Lỗi kết nối Modbus:', err);
      this.isModbusConnected = false;
    });
  }

  disconnectModbus(){
    client.close(() => {
      console.log('Modbus disconnected');
      this.isModbusConnected = false;
    });
  }

  // Phương thức trả về mảng floatArray
  getFloatArray() {
    return this.floatArray;
  }
}

// Tạo một đối tượng của lớp ModbusUtil và export nó
const modbusUtil = new ModbusUtil();
module.exports = modbusUtil;
