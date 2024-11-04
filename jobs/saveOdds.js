const axios = require("axios");
const { genToken } = require('../function/credential');
const { getTodayStartTime, getTodayAt2PM, getDiffernceDateWithMin, getDiffernceDateWithHour } = require('../function/time');
const { Client } = require('pg');

exports.saveOdds = async() => {
    var token = genToken();
    const startTime = getTodayStartTime();
    const openTime = getTodayAt2PM();
    const currentTime = new Date();

    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'betmlb',
        password: 'lucamlb123',
        port: 5432,
    })

    await client.connect();

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
        console.log(error);
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

    for (var x in events) {
        var gamedate = new Date(events[x].starts);
        if (getDiffernceDateWithHour(startTime, gamedate) != -1) {
            for (var y in games) {
                if(games[y].id != undefined && games[y].id == events[x].id)
                    if(games[y].periods != undefined && games[y].periods[0].moneyline != undefined) {
                        if(games[y].periods[0].moneyline.away != undefined && games[y].periods[0].moneyline.home != undefined)
                            if(getDiffernceDateWithMin(openTime, currentTime) != -1 && getDiffernceDateWithMin(openTime, currentTime) < 2)
                                await client.query(`UPDATE odds_table SET away_open = '${games[y].periods[0].moneyline.away}', home_open = '${games[y].periods[0].moneyline.home}' WHERE away = '${events[x].away}' AND home = '${events[x].home}' AND start_time = '${events[x].starts}';`);
                            if(getDiffernceDateWithMin(currentTime, gamedate) != -1 && getDiffernceDateWithMin(currentTime, gamedate) < 2)
                                await client.query(`UPDATE odds_table SET away_close = '${games[y].periods[0].moneyline.away}', home_close = '${games[y].periods[0].moneyline.home}' WHERE away = '${events[x].away}' AND home = '${events[x].home}' AND start_time = '${events[x].starts}';`);
                    }
            }       
        }
    }

    await client.end();
}
