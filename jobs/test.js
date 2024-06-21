const axios = require("axios");
const { genToken } = require('../function/credential');
const { getTodayStartTime, getTodayAt2PM, getDiffernceDateWithMin, getDiffernceDateWithHour } = require('../function/time');

const saveOdds = async() => {
    var token = genToken();
    const openTime = getTodayAt2PM();
    const currentTime = new Date();

    console.log('start');

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

    console.log('games');

    for (var x in events) {
        for (var y in games) {
            if(games[y].id != undefined && games[y].id == events[x].id)
                if(games[y].periods != undefined && games[y].periods[0].moneyline != undefined) {
                    console.log(games[y])
                    console.log(events[x])
                }
        }       
    }
}

saveOdds();