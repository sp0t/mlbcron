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
    var res_bettings = await client.query(`SELECT COUNT(betid), betdate, team1, team2, place FROM betting_table WHERE status = '0' AND regstate = '1' GROUP BY betdate, team1, team2, place;`);
    
    if(res_bettings.rows != undefined && res_bettings.rows.length > 0) {
        for(var x in res_bettings.rows) {
            var gamedate = res_bettings.rows[x].betdate.replace(/-/g, '/');
            var res = await client.query(`SELECT game_id FROM odds_table WHERE game_date = '${gamedate}' AND away = '${res_bettings.rows[x].team1}' AND home = '${res_bettings.rows[x].team2}';`);
            if(res.rows != undefined && res.rows[0].game_id != undefined) {
                try {
                    var response = await axios.post('http://127.0.0.1:5000/getWinStatus', {
                        gameid: res.rows[0].game_id,
                    });
                } catch (error) {
                    await client.end();
                    return;
                }

                var status = 0;

                if (response.data != undefined) {
                    if(response.data.away_score != undefined && response.data.home_score != undefined) {
                        if(parseInt(response.data.away_score) != 0 || parseInt(response.data.home_score) != 0) {
                            if (parseInt(response.data.away_score) > parseInt(response.data.home_score)) {
                                if(res_bettings.rows[x].team1 == res_bettings.rows[x].place)
                                    status = 2;
                                else
                                    status = 1;
                            } else if (parseInt(response.data.away_score) < parseInt(response.data.home_score)) {
                                if(res_bettings.rows[x].team1 == res_bettings.rows[x].place)
                                    status = 1;
                                else
                                    status = 2;
                            }
                            
                            try {
                                var response = await axios.post('http://127.0.0.1:5000/showbetting', {
                                    gamedate: res_bettings.rows[x].betdate,
                                    away: res_bettings.rows[x].team1,
                                    home: res_bettings.rows[x].team2,
                                    status: status,
                                    place: res_bettings.rows[x].place
                                });
                            } catch (error) {
                                await client.end();
                                return;
                            }

                        }
                    }
                }
            }
        }
    }
    
    await client.end();
}

