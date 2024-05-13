require('dotenv').config()
const axios = require("axios");
const { dateToString, getDiffernceDateWithMin } = require('../function/time');
const { Client } = require('pg');
const { genToken } = require('../function/credential');

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

    // var res = await client.query(`SELECT * FROM odds_table WHERE auto_bet = '1' AND state = '2';`);
    var res = await client.query(`SELECT * FROM odds_table WHERE auto_bet = '1';`);

    if(res.rows != undefined) {

        var token = genToken();
        var options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            params: {
                sportId: 3,
                leagueIds: 246,
            }
        };
        
        try {
            var [retodd, retfixture] = await Promise.all([
                axios.get("https://api.ps3838.com/v3/odds", options),
                axios.get("https://api.ps3838.com/v3/fixtures", options)
            ]);
        } catch (error) {
            console.log(error)
            await client.end();
            return;
        }

        if (retfixture.data.league == undefined) {
            await client.end();
            return;
        }

        if (retfixture.data.league[0].events == undefined) {
            await client.end();
            return;
        }
        
        if (retfixture.data.league[0].events.length == 0) {
            await client.end();
            return;
        }
    
        var events = retfixture.data.league[0].events;
    
        if(retodd.data.leagues == undefined) {
            await client.end();
            return;
        }
        
        if(retodd.data.leagues[0].events == undefined) {
            await client.end();
            return;
        }
    
        if(retodd.data.leagues[0].events.length == 0) {
            await client.end();
            return;
        }

        var games = retodd.data.leagues[0].events;

        for(var i = 0; i < res.rows.length; i++) {
            var startime = new Date(res.rows[i].start_time);
            if(getDiffernceDateWithMin(currentTime, startime) != -1) {
                console.log(res.rows[x]);
                try {
                    var response = await axios.post('http://127.0.0.1:5000/getTarget', {
                            gameid: res.rows[i].game_id,
                        });
                } catch (error) {
                    await client.end();
                    return;
                }
                
                if(response.data != undefined) {
                    console.log(response.data)

                    for (var x in events) {
                        for (var y in games) {
                            if(games[y].id != undefined && games[y].id == events[x].id) {
                                if(games[y].periods != undefined && games[y].periods[0].moneyline != undefined) {
                                    if(games[y].periods[0].moneyline.away != undefined && games[y].periods[0].moneyline.home != undefined) {
                                        if(events[x].away == res.rows[i].away && events[x].home == res.rows[i].home && events[x].starts == res.rows[i].start_time) {
                                            console.log(events[x].away, events[x].home, events[x].starts)
                                            console.log(games[y].periods[0].moneyline)

                                            var betoption = {
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': token
                                                },
                                                params: {
                                                    "oddsFormat": "languages",
                                                    "acceptBetterLine": true,
                                                    "stake": 10.5,
                                                    "winRiskStake": "RISK",
                                                    "lineId": games[y].periods[0].lineId,
                                                    "pitcher1MustStart": true,
                                                    "pitcher2MustStart": true,
                                                    "fillType": "NORMAL",
                                                    "sportId": 3,
                                                    "eventId": events[x].id,
                                                    "betType": "MONEYLINE",
                                                    "team": "TEAM1",
                                                }
                                            };

                                            console.log(betoption)
                                        }
                                    }                                        
                                }
                            }
                        }    
                    }
                } else {
                    var respond = await client.query(`UPDATE odds_table SET auto_bet = '0' WHERE game_id = '${res.rows[i].game_id}';`);
                }
            } else {
                var respond = await client.query(`UPDATE odds_table SET auto_bet = '0' WHERE game_id = '${res.rows[i].game_id}';`);
            }
        } 
    }
    await client.end();
}


update();