const axios = require("axios");
const { Client } = require('pg');
const { getDiffernceDateWithHour, addOneDayToDate } = require('../function/time');

exports.update = async() => {
    const currentTime = new Date();
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'betmlb',
        password: 'lucamlb123',
        port: 5432,
    })

    await client.connect();
    var res_lastgame = await client.query(`SELECT * FROM odds_table WHERE start_time is NOT NULL ORDER BY start_time DESC LIMIT 1;`);
    var res_lastday = await client.query(`SELECT * FROM updates ORDER BY update_date DESC LIMIT 1;`);
    await client.end();
    
    if (res_lastgame.rows[0].start_time != undefined && res_lastday.rows[0].update_date != undefined && res_lastgame.rows[0].game_id != undefined) {
        const startime = new Date(res_lastgame.rows[0].start_time);
        const gamedate = new Date(res_lastday.rows[0].update_date);   
        const newdate = addOneDayToDate(gamedate);
        newdate.setUTCHours(0, 0, 0, 0); 
        if(getDiffernceDateWithHour(newdate, currentTime) != -1 && getDiffernceDateWithHour(startime, currentTime) > 2) {
            try {
                var response = await axios.post('http://127.0.0.1:5000/getLastGameStatus', {
                        gameid: res_lastgame.rows[0].game_id,
                    });
            } catch (error) {
                return;
            }

            console.log(response.data.state)
    
            if(response.data.state != undefined) {
                if (response.data.state > 10) {
                    const response = await axios.post('http://127.0.0.1:5000/update_data', {
                    });
                }
            }
        }
    }
}
