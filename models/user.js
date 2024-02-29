const db = require('../util/database')

module.exports = class User{
    constructor(name, username, password) {
        this.name = name;
        this.username= username;
        this.password = password;
    }

    static find(username) {
        return db.execute(
            'SELECT * FROM users WHERE username = ?',[username]
        );
    }

    static save(user) {
        return db.execute(
            'INSERT INTO users (username, password, name) VALUES (?, ?, ?)',
             [user.username, user.password, user.name]
        );        
    }
};

