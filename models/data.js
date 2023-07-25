const db = require('../util/database');

module.exports = class Data {
  constructor(tag, name, expectedValue, realtimeValue, unit, designP, upperbound, lowerbound) {
    this.name = name;
    this.tag = tag;
    this.realtimeValue = realtimeValue;
    this.expectedValue = expectedValue;
    this.unit = unit;
    this.designP = designP;
    this.upperbound = upperbound;
    this.lowerbound = lowerbound;
  }

  static fetchAll() {
    return db.execute('SELECT * FROM data');
  }

  static save(data) {
    return db.execute(
      'INSERT INTO data (tag, name, expectedValue, realtimeValue, unit, designP, upperbound, lowerbound) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.tag, data.name, data.expectedValue, data.realtimeValue, data.unit, data.designP, data.upperbound, data.lowerbound]
    );
  }

  static updateExpectedValue(tag, expectedValue) {
    return db.execute('UPDATE data SET expectedValue = ? WHERE tag = ?', [expectedValue, tag]);
  }

  static updateBounds(tag, upperbound, lowerbound) {
    return db.execute('UPDATE data SET upperbound = ?, lowerbound = ? WHERE tag = ?', [upperbound, lowerbound, tag]);
  }

  static insertModbusValue(floatArray) {
    // Lấy một kết nối từ pool
    db.getConnection((err, connection) => {
      if (err) {
        console.error('Lỗi khi lấy kết nối từ pool: ' + err.stack);
        return;
      }
      // Vòng lặp để chèn giá trị từ mảng vào bảng "data"
      for (let i = 0; i < floatArray.length; i++) {
        const floatValue = floatArray[i];
        let sql = '';
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
          sql = `UPDATE data SET realtimeValue = ? WHERE tag = ?`;
          const values = [floatValue, tag];
        
          // Query
          connection.query(sql, values, (error, results, fields) => {
            if (error) {
              console.error('Lỗi khi cập nhật dữ liệu: ' + error.message);
              return;
            }
            console.log(`Cập nhật dữ liệu thành công cho tag ${tag}`);
          });
        }
      }
      connection.release(); // Trả kết nối về pool
    });
  }
};
