const db = require('../util/database')

module.exports = class Data {
    constructor(tag, name, setPoint, realtimeValue, unit, designP) {
        this.name = name;
        this.tag = tag;
        this.realtimeValue = realtimeValue;
        this.setPoint = setPoint;
        this.unit = unit;
        this.designP = designP;
    }

    static fetchAll() {
        return db.execute('SELECT * FROM data')
    }

    static save(data) {
        return db.execute(
            'INSERT INTO data (tag, name, setPoint, realtimeValue, unit, designP) VALUES (?, ?, ?, ?, ?, ?)',
             [data.tag, data.name, data.setPoint, data.realtimeValue, data.unit, data.designP ]
        );        
    }
};

