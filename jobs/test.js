require('dotenv').config()
const axios = require("axios");
const { dateToString, getDiffernceDateWithMin } = require('../function/time');
const { Client } = require('pg');


const update = async() => {

    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'betmlb',
        password: 'lucamlb123',
        port: 5432,
    })

    const currentTime = new Date();
    const gamedate = dateToString(currentTime);

    await client.connect();
    var res = await client.query(`SELECT * FROM odds_table WHERE auto_bet = '1' AND state = '2';`);

    if(res.rows != undefined) {
        for(var x = 0; x < res.rows.length; x++) {
            var startime = new Date(res.rows[x].start_time);
            if(getDiffernceDateWithMin(currentTime, startime) != -1) {
                console.log(res.rows[x]);
                try {
                    var response = await axios.post('http://127.0.0.1:5000/getTarget', {
                            gameid: res.rows[x].game_id,
                        });
                } catch (error) {
                    return;
                }

                
                if(response.data != undefined) {
                    console.log(response.data)
                }
            } else {
                var respond = await client.query(`UPDATE odds_table SET auto_bet = '0' WHERE game_id = '${res.rows[x].game_id}';`);
            }
        } 
    }
    await client.end();
}


update();