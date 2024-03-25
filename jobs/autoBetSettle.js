const axios = require("axios");
const { Client } = require('pg');

exports.autoBetSettle = async() => {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'betmlb',
        password: 'lucamlb123',
        port: 5432,
    })

    await client.connect();
    var res_bettings = await client.query(`SELECT * FROM schedule;`);
    await client.end();

    console.log(res_bettings.rows)
    
    try {
        var response = await axios.post('http://127.0.0.1:5000/getWinStatus', {
                gameid: res.rows[0].game_id,
            });
    } catch (error) {
        return;
    }

    console.log(response.data)
}
