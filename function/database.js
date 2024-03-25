const { Client } = require('pg');

exports.connectDB = async() => {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'luca',
        password: 'postgres',
        port: 5432,
    })

    // const client = new Client({
    //     user: 'postgres',
    //     host: 'localhost',
    //     database: 'betmlb',
    //     password: 'lucamlb123',
    //     port: 5432,
    // })

    return client;
}