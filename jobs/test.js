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

        var headers =  {
            'Content-Type': 'application/json',
            'Authorization': token
        }

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
            var betdate = res.rows[i].game_date.replace(/\//g, '-');
            if(getDiffernceDateWithMin(currentTime, startime) != -1) {
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

                    if (away_prob !== 0 && away_prob < 48) {
                        away_odd = 0;
                    } else if (away_prob === 0) {
                        away_odd = 0;
                    } else if (response.data[0]['la_away_odd'] !== null && response.data[0]['lb_away_odd'] !== null) {
                        away_odd = response.data[0]['la_away_odd'] * 0.8 + response.data[0]['lb_away_odd'] * 0.2;
                    }

                    if (away_odd !== 0) {
                        away_odd = decimalToAmerican(away_odd);
                    }

                    if (home_prob !== 0 && home_prob < 48) {
                        home_odd = 0;
                    } else if (home_prob === 0) {
                        home_odd = 0;
                    } else if (response.data[0]['la_home_odd'] !== null && response.data[0]['lb_home_odd'] !== null) {
                        home_odd = response.data[0]['la_home_odd'] * 0.8 + response.data[0]['lb_home_odd'] * 0.2;
                    }

                    if (home_odd !== 0) {
                        home_odd = decimalToAmerican(home_odd);
                    }

                    for (var x in events) {
                        for (var y in games) {
                            if(games[y].id != undefined && games[y].id == events[x].id) {
                                if(games[y].periods != undefined && games[y].periods[0].moneyline != undefined) {
                                    if(games[y].periods[0].moneyline.away != undefined && games[y].periods[0].moneyline.home != undefined) {
                                        if(events[x].away == res.rows[i].away && events[x].home == res.rows[i].home && events[x].starts == res.rows[i].start_time) {
                                            console.log(games[y].periods[0].moneyline)
                                            if(away_odd != 0 && games[y].periods[0].moneyline.away >= away_odd) {
                                                var awayoption = {
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
                                                    "team": "TEAM1"
                                                };
                                                
                                                try {
                                                    var awayres = await axios.post("https://api.ps3838.com/v2/bets/place", awayoption, headers);
                                                } catch (error) {
                                                    if (error.response) {
                                                        // The request was made and the server responded with a status code
                                                        // that falls out of the range of 2xx
                                                        console.log(error.response.data);
                                                        console.log(error.response.status);
                                                        console.log(error.response.headers);
                                                    } else if (error.request) {
                                                        // The request was made but no response was received
                                                        console.log(error.request);
                                                    } else {
                                                        // Something happened in setting up the request that triggered an Error
                                                        console.log('Error', error.message);
                                                    }
                                                    console.log(error.config);
                                                    await client.end();
                                                    return;
                                                }

                                                if(awayres.status == 'ACCEPTED') {
                                                    await client.query(`INSERT INTO autobet_table (betdate, game, team1, team2, market, place, odds, price, target, stake, wins, placedat, status, site, betid) 
                                                                        VALUES ('${betdate}', '${res.rows[i].away} vs ${res.rows[i].home}', '${res.rows[i].away}', '${res.rows[i].home}', '${awayres.straightBet.betType}', '${res.rows[i].away}', '${games[y].periods[0].moneyline.away}', '${awayres.straightBet.price}', '${away_odd}', '50', '${awayres.straightBet.win}', '${awayres.straightBet.placedAt}', '0', 'ps3838.com', '${awayres.straightBet.betId}');`);
                                                    await client.query(`UPDATE odds_table SET auto_bet = '0' WHERE game_id = '${res.rows[i].game_id}';`);
                                                }
                                                
                                            } 

                                            if(home_odd != 0 && games[y].periods[0].moneyline.home >= home_odd) {
                                                var homeoption = {
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
                                                    "team": "TEAM2"
                                                };

                                                try {
                                                    var homeres = await axios.post("https://api.ps3838.com/v2/bets/place", homeoption, headers);
                                                } catch (error) {
                                                    if (error.response) {
                                                        // The request was made and the server responded with a status code
                                                        // that falls out of the range of 2xx
                                                        console.log(error.response.data);
                                                        console.log(error.response.status);
                                                        console.log(error.response.headers);
                                                    } else if (error.request) {
                                                        // The request was made but no response was received
                                                        console.log(error.request);
                                                    } else {
                                                        // Something happened in setting up the request that triggered an Error
                                                        console.log('Error', error.message);
                                                    }
                                                    console.log(error.config);
                                                    await client.end();
                                                    return;
                                                }
                                                
                                                if(homeres.status == 'ACCEPTED') {
                                                    await client.query(`INSERT INTO autobet_table (betdate, game, team1, team2, market, place, odds, price, target, stake, wins, placedat, status, site, betid) 
                                                                        VALUES ('${betdate}', '${res.rows[i].away} vs ${res.rows[i].home}', '${res.rows[i].away}', '${res.rows[i].home}', '${awayres.straightBet.betType}', '${res.rows[i].home}', '${games[y].periods[0].moneyline.home}', '${awayres.straightBet.price}', '${home_odd}', '50', '${awayres.straightBet.win}', '${awayres.straightBet.placedAt}', '0', 'ps3838.com', '${awayres.straightBet.betId}');`);
                                                    await client.query(`UPDATE odds_table SET auto_bet = '0' WHERE game_id = '${res.rows[i].game_id}';`);
                                                }
                                            }
                                        }
                                    }                                        
                                }
                            }
                        }    
                    }
                } else {
                    await client.query(`UPDATE odds_table SET auto_bet = '0' WHERE game_id = '${res.rows[i].game_id}';`);
                }
            } else {
                await client.query(`UPDATE odds_table SET auto_bet = '0' WHERE game_id = '${res.rows[i].game_id}';`);
            }
        } 
    }
    await client.end();
}


update();