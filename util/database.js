const mysql = require('mysql2');
const config = require('../config/config.json');

const pool = mysql.createPool({
    host: config.host,
    user: config.user,
    database: config.database,
    password: config.password
});
console.log('Kết nối thành công đến SQl')
module.exports = pool.promise(); 