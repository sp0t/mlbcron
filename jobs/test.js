require('dotenv').config()
const axios = require("axios");
const { dateToString, getDiffernceDateWithMin } = require('../function/time');
const { decimalToAmerican, americanToDecimal } = require('../function/odds');
const { Client } = require('pg');
const { genToken } = require('../function/credential');

const update = async() => {

    var away_odd = 0;
    var home_odd = 0;
    var away_prob = 0;
    var home_prob = 0;

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
                    away_odd = 0;
                    home_odd = 0;
                    away_prob = 0;
                    home_prob = 0;
                    console.log(response.data)

                    // Assuming you have a utility object `odds` with methods `americanToDecimal` and `decimalToAmerican`
                    if (response.data[0]['la_away_odd'] !== null) {
                        response.data[0]['la_away_odd'] = americanToDecimal(parseFloat(response.data[0]['la_away_odd']));
                    }
                    if (response.data[0]['la_home_odd'] !== null) {
                        response.data[0]['la_home_odd'] = americanToDecimal(parseFloat(response.data[0]['la_home_odd']));
                    }
                    if (response.data[0]['lb_away_odd'] !== null) {
                        response.data[0]['lb_away_odd'] = americanToDecimal(parseFloat(response.data[0]['lb_away_odd']));
                    }
                    if (response.data[0]['lb_home_odd'] !== null) {
                        response.data[0]['lb_home_odd'] = americanToDecimal(parseFloat(response.data[0]['lb_home_odd']));
                    }

                    if (response.data[0]['la_away_prob'] !== null && response.data[0]['lb_away_prob'] !== null) {
                        away_prob = parseFloat(response.data[0]['la_away_prob']) * 0.8 + parseFloat(response.data[0]['lb_away_prob']) * 0.2;
                        home_prob = parseFloat(response.data[0]['la_home_prob']) * 0.8 + parseFloat(response.data[0]['lb_home_prob']) * 0.2;
                    } else {
                        away_prob = 0;
                        home_prob = 0;
                    }

                    if (response.data[0]['away_prob'] !== null && response.data[0]['away_prob'] < 48) {
                        away_odd = 0;
                    } else if (response.data[0]['away_prob'] === null) {
                        away_odd = 0;
                    } else if (response.data[0]['la_away_odd'] !== null && response.data[0]['lb_away_odd'] !== null) {
                        away_odd = response.data[0]['la_away_odd'] * 0.8 + response.data[0]['lb_away_odd'] * 0.2;
                    }

                    if (away_odd !== 0) {
                        away_odd = decimalToAmerican(away_odd);
                    }

                    if (response.data[0]['home_prob'] !== null && response.data[0]['home_prob'] < 48) {
                        home_odd = 0;
                    } else if (response.data[0]['home_prob'] === null) {
                        home_odd = 0;
                    } else if (response.data[0]['la_home_odd'] !== null && response.data[0]['lb_home_odd'] !== null) {
                        home_odd = response.data[0]['la_home_odd'] * 0.8 + response.data[0]['lb_home_odd'] * 0.2;
                    }

                    if (home_odd !== 0) {
                        home_odd = decimalToAmerican(home_odd);
                    }

                    console.log('away_odd', away_odd)
                    console.log('home_odd', home_odd)


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
                                                    "oddsFormat": "AMERICAN",
                                                    "acceptBetterLine": true,
                                                    "stake": 50,
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