const mysql = require('mysql2');
const config = require('../config/config.json');
const { Result } = require('express-validator');
//const Connection = require('mysql2/typings/mysql2/lib/Connection');

const pool = mysql.createPool({
    host: config.host,
    user: config.user,
    database: config.database,
    password: config.password,
    connectionLimit: 12
})

function insertFloatValue(floatArray){
  // Lấy một kết nối từ pool
  pool.getConnection((err, connection) => {
    if(err){
      console.error('Lỗi khi lấy kết nối từ pool: ' + err.stack);
      return;
    }
  console.log('Đã lấy một kết nối từ pool.');

  // Vòng lặp để chèn giá trị từ mảng vào bảng "data"
  for (let i = 0; i < floatArray.length; i++) {
    const floatValue = floatArray[i];
    let values = [];
    let sql ='';

    // Kiểm tra giá trị của i
    if ((i >= 0 && i <= 5) || (i >= 12 && i <= 17)) {
      switch (i) {
        case 0:
          values = [`1HNE10CQ207`, `Flue gas H2O`, 0, floatValue, 'vol', 'at stack', 11.0, 9.0];
          break;
        case 1:
          values = [`1HNE10CQ205`, `Flue gas HCL`, 1, floatValue, 'mg/Nm3', 'at stack', 11.0, 9.0];
          break;
        case 2:
          values = [`1HNE10CQ204`, `Flue gas SO2`, 2, floatValue, 'mg/Nm3', 'at stack', 11.0, 9.0];
          break;
        case 3:
          values = [`1HNE10CQ203`, `Flue gas NOx`, 3, floatValue, 'mg/Nm3', 'at stack', 11.0, 9.0];
          break;
        case 4:
          values = [`1HNE10CQ202`, `Flue gas CO`, 4, floatValue, 'mg/Nm3', 'at stack', 11.0, 9.0];
          break;
        case 5:
          values = [`1HNE10CQ201`, `Flue gas O2`, 5, floatValue, 'vol', 'at stack', 11.0, 9.0];
          break;
        case 12:
          values = [`1HNECQ206`, `FT FLOW`, 6, floatValue, 'Nm3/s', 'at stack', 11.0, 9.0];
          break;
        case 13:
          values = [`1HNECF201`, `FT TEMP`, 7, floatValue, 'oC', 'at stack', 11.0, 9.0];
          break;
        case 14:
          values = [`1HNECP201`, `FT PRESSURE`, 8, floatValue, 'Pa', 'at stack', 11.0, 9.0];
          break;
        case 15:
          values = [`1HNECQ002`, `FT DUST`, 9, floatValue, 'mg/Nm3', 'at stack', 11.0, 9.0];
          break;
        case 16:
          values = [`T-TT0301`, `Furnace TT0301`, 10, floatValue, 'oC', 'at stack', 11.0, 9.0];
          break;
        case 17:
          values = [`T-TT0302`, `Furnace TT0302`, 11, floatValue, 'oC', 'at stack', 11.0, 9.0];
          break;
        default:
          break;
      }

      // Thực hiện truy vấn chỉ với các giá trị i cụ thể
      sql = `INSERT INTO \`data\` (\`tag\`, \`name\`, \`expectedValue\`, \`realtimeValue\`, \`unit\`, \`designP\`, \`upperbound\`, \`lowerbound\`) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            \`name\` = VALUES(\`name\`), 
            \`expectedValue\` = VALUES(\`expectedValue\`), 
            \`realtimeValue\` = VALUES(\`realtimeValue\`), 
            \`unit\` = VALUES(\`unit\`), 
            \`designP\` = VALUES(\`designP\`), 
            \`upperbound\` = VALUES(\`upperbound\`), 
            \`lowerbound\` = VALUES(\`lowerbound\`)`;

    //Query
    connection.query(sql, values, (error, results, fields) => {
      if(error){
        console.error('Lỗi khi chèn dữ liệu: ' + error.message);
        return;
      }
    console.log('Dữ liệu đã được chèn thành công vào cơ sở dữ liệu.');
  });
}}

connection.release();//Tra ket noi ve sau khi hoan thanh truy van
console.log('Đã trả kết nối về pool.'); 
});
}

module.exports = {
  pool: pool.promise(),
  insertFloatValue: insertFloatValue
};