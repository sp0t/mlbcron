const axios = require("axios");
const { genToken } = require('../function/credential');
const io = require('socket.io-client');
const socket = io('http://127.0.0.1:5000');

const saveOdds = async() => {
    var token = genToken();
    var data = []

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

    for (var x in events) {
        var oddData = {};
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
                }
        }       
    }

    // try {
    //     const response = await axios.post('http://127.0.0.1:5000/liveodds', { data: data });
    //     console.log('Data sent successfully:', response.data);
    // } catch (error) {
    //     console.error('Error sending data:', error);
    // }

    socket.emit('send_odd_values', data);

    console.log(data)
}

saveOdds();