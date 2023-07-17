const mysql = require('mysql2');
const config = require('../config/config.json');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: config.host,
  user: config.user,
  database: config.database,
  password: config.password,
});

function insertInitialValuesToData() {
  // Initial Value for table cems.data
  // Có thể khởi tạo expectedValue, upperbound, lowerbound ở đây.
  const dataInitialValues = [
    [`1HNE10CQ207`, `Flue gas H2O`, 0, 0, 'vol', 'at stack', 11.0, 9.0],
    [`1HNE10CQ205`, `Flue gas HCL`, 1, 1, 'mg/Nm3', 'at stack', 11.0, 9.0],
    [`1HNE10CQ204`, `Flue gas SO2`, 2, 2, 'mg/Nm3', 'at stack', 11.0, 9.0],
    [`1HNE10CQ203`, `Flue gas NOx`, 3, 3, 'mg/Nm3', 'at stack', 11.0, 9.0],
    [`1HNE10CQ202`, `Flue gas CO`, 4, 4, 'mg/Nm3', 'at stack', 11.0, 9.0],
    [`1HNE10CQ201`, `Flue gas O2`, 5, 5, 'vol', 'at stack', 11.0, 9.0],
    [`1HNECQ206`, `FT FLOW`, 6, 6, 'Nm3/s', 'at stack', 11.0, 9.0],
    [`1HNECF201`, `FT TEMP`, 7, 7, 'oC', 'at stack', 11.0, 9.0],
    [`1HNECP201`, `FT PRESSURE`, 8, 8, 'Pa', 'at stack', 11.0, 9.0],
    [`1HNECQ002`, `FT DUST`, 9, 9, 'mg/Nm3', 'at stack', 11.0, 9.0],
    [`T-TT0301`, `Furnace TT0301`, 10, 10, 'oC', 'at stack', 11.0, 9.0],
    [`T-TT0302`, `Furnace TT0302`, 11, 11, 'oC', 'at stack', 11.0, 9.0],
  ];

  let sql = `INSERT INTO \`data\` (\`tag\`, \`name\`, \`expectedValue\`, \`realtimeValue\`, \`unit\`, \`designP\`, \`upperbound\`, \`lowerbound\`) 
  VALUES ?`;

  // Query
  pool.query(sql, [dataInitialValues], (error, results, fields) => {
    if (error) {
      console.error('Lỗi khi chèn dữ liệu ban đầu vào bảng "data": ' + error.message);
      return;
    }
    console.log('Dữ liệu ban đầu đã được chèn thành công vào bảng "data".');
  });
}

function insertFloatValue(floatArray) {
  // Lấy một kết nối từ pool
  pool.getConnection((err, connection) => {
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
        sql = `UPDATE cems.data SET realtimeValue = ? WHERE tag = ?`;
        const values = [floatValue, tag];

        // Query
        connection.query(sql, values, (error, results, fields) => {
          if (error) {
            console.error('Lỗi khi cập nhật dữ liệu: ' + error.message);
            return;
          }
        });
      }
    }

    connection.release(); // Trả kết nối về pool
  });
}

module.exports = {
  pool: pool.promise(),
  insertInitialValuesToData: insertInitialValuesToData,
  insertFloatValue: insertFloatValue,
};
