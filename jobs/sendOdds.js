const axios = require("axios");
const { genToken } = require('../function/credential');
const { getTodayStartTime, getTodayAt2PM, getDiffernceDateWithMin, getDiffernceDateWithHour } = require('../function/time');
const { Client } = require('pg');

exports.sendOdds = async() => {
    // const client = new Client({
    //     user: 'postgres',
    //     host: 'localhost',
    //     database: 'betmlb',
    //     password: 'lucamlb123',
    //     port: 5432,
    // })

    var token = genToken();
    const startTime = getTodayStartTime();
    const openTime = getTodayAt2PM();
    const currentTime = new Date();
    var data = []
    var options = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
        params: {
            sportId: 3,
            leagueIds: 246
        }
    };
    
    try {
        var [retodd, retfixture] = await Promise.all([
            axios.get("https://api.ps3838.com/v3/odds", options),
            axios.get("https://api.ps3838.com/v3/fixtures", options)
        ]);
    } catch (error) {
        console.log(error)
        return;
    }

    if (retfixture.data.league == undefined)
        return;

    if (retfixture.data.league[0].events == undefined)
        return;
    
    if (retfixture.data.league[0].events.length == 0)
        return;

    var events = retfixture.data.league[0].events;

    if(retodd.data.leagues == undefined)
        return;
    
    if(retodd.data.leagues[0].events == undefined)
        return;

    if(retodd.data.leagues[0].events.length == 0)
        return;
    
    var games = retodd.data.leagues[0].events;

    for (var x in events) {
        var oddData = {};
        var gamedate = new Date(events[x].starts);
        for (var y in games) {
            if(games[y].id != undefined && games[y].id == events[x].id)
                if(games[y].periods != undefined && games[y].periods[0].moneyline != undefined) {
                    oddData['starts'] = events[x].starts;
                    oddData['away'] = events[x].away;
                    oddData['home'] = events[x].home;
                    if(games[y].periods[0].moneyline != undefined) {
                        if(games[y].periods[0].moneyline.away != undefined)
                            oddData['away_odd'] = games[y].periods[0].moneyline.away;
                        else    
                            oddData['away_odd'] = 0;

                        if(games[y].periods[0].moneyline.home != undefined)
                            oddData['home_odd'] = games[y].periods[0].moneyline.home
                        else    
                            oddData['home_odd'] = 0;
                    } else {
                        oddData['away_odd'] = 0;
                        oddData['home_odd'] = 0;
                    }

                    data.push(oddData);

                    // if(games[y].periods[0].moneyline.away != undefined && games[y].periods[0].moneyline.home != undefined) {
                    //     if (getDiffernceDateWithHour(startTime, gamedate) != -1) {
                    //         if(getDiffernceDateWithMin(openTime, currentTime) != -1 && getDiffernceDateWithMin(openTime, currentTime) < 1) {

                    //             await client.query(`UPDATE odds_table SET away_open = '${games[y].periods[0].moneyline.away}', home_open = '${games[y].periods[0].moneyline.home}' WHERE away = '${events[x].away}' AND home = '${events[x].home}' AND start_time = '${events[x].starts}';`);
                    //         }
                    //         console.log('currnet-gamedate', getDiffernceDateWithMin(currentTime, gamedate), events[x].away, events[x].home)
                    //         if(getDiffernceDateWithMin(currentTime, gamedate) != -1 && getDiffernceDateWithMin(currentTime, gamedate) < 15) {
                    //             console.log('insert odds..................');

                    //             console.log(`UPDATE odds_table SET away_close = '${games[y].periods[0].moneyline.away}', home_close = '${games[y].periods[0].moneyline.home}' WHERE away = '${events[x].away}' AND home = '${events[x].home}' AND start_time = '${events[x].starts}';`)

                    //             await client.query(`UPDATE odds_table SET away_close = '${games[y].periods[0].moneyline.away}', home_close = '${games[y].periods[0].moneyline.home}' WHERE away = '${events[x].away}' AND home = '${events[x].home}' AND start_time = '${events[x].starts}';`);
                               
                    //         }
                    //     }
                    // }
                }
        }       
    }

    // await client.end();

    try {
        const response = await axios.post('http://127.0.0.1:5000/liveodds', { data: data });
        console.log('Data sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending data:', error);
    }
}
