const axios = require("axios");
const { Client } = require('pg');
const { getDiffernceDateWithHour, addOneDayToDate } = require('../function/time');
const { dateToString, getDiffernceDateWithMin } = require('../function/time');

const update = async() => {
    const checkmark = ':white_check_mark:';
    const crossmark = ':x:';

    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'betmlb',
        password: 'lucamlb123',
        port: 5432,
    })

    const currentTime = new Date();
    const gamedate = dateToString(currentTime);
    console.log(gamedate)

    await client.connect();
    var res = await client.query(`SELECT * FROM odds_table WHERE state != '2' AND game_date = '${gamedate}' ORDER BY start_time ASC;`);
    console.log(res.rows)

    if(res.rows != undefined) {
        for(var x = 0; x < res.rows.length; x++) {
            var startime = new Date(res.rows[x].start_time);
            if(getDiffernceDateWithMin(currentTime, startime) != -1) {
                console.log(res.rows[x].game_id)
                try {
                    var response = await axios.post('http://127.0.0.1:5000/getLineupStatus', {
                            gameid: res.rows[x].game_id,
                        });
                } catch (error) {
                    return;
                }

                console.log(res.rows[x].game_id, response.data)


                if(response.data != undefined) {
                    if (response.data.away != 0 || response.data.home != 0 ) {
                        var message = `${res.rows[x].away} @ ${res.rows[x].home}\n${res.rows[x].away} ${response.data.away == 1 ? checkmark: crossmark}\n${res.rows[x].home} ${response.data.home == 1 ? checkmark: crossmark}`;
                        if(response.data.away != 0 && response.data.home != 0)
                            var respond = await client.query(`UPDATE odds_table SET state = '2' WHERE game_id = '${res.rows[x].game_id}';`);
                        else
                            var respond = await client.query(`UPDATE odds_table SET state = '1' WHERE game_id = '${res.rows[x].game_id}';`);
                        
                        if(response.data.away != 0 && response.data.home != 0 || res.rows[x].state == 0)
                            await sendMessage(process.env.SLACK_CHANNEL_ID, message);
                        }
                    }
                }
            }
        }
    await client.end();
}


update();