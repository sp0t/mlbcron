const axios = require("axios");
const { Client } = require('pg');

const autoBetSettle = async() => {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'betmlb',
        password: 'lucamlb123',
        port: 5432,
    })

    await client.connect();
    

    try {
        var response = await axios.post('http://127.0.0.1:5000/getWinStatus', {
            gameid: '747815',
        });
    } catch (error) {
        return;
    }

    var status = 0;
    var team1 = 'Toronto Blue Jays';
    var team2 = 'Pittsburgh Pirates';
    var place = 'Pittsburgh Pirates';


    if (response.data != undefined) {
        if(response.data.away_score != undefined && response.data.home_score != undefined) {
            if(response.data.away_score != 0 || response.data.home_score != 0) {
                if (response.data.away_score > response.data.home_score) {
                    if(team1 == place)
                        status = 2;
                    else
                        status = 1;
                } else if (response.data.away_score < response.data.home_score) {
                    if(team1 == place)
                        status = 1;
                    else
                        status = 2;
                }

                console.log('state', status)
                
                // try {
                //     var response = await axios.post('http://127.0.0.1:5000/showbetting', {
                //         gamedate: res_bettings.rows[x].betdate,
                //         away: res_bettings.rows[x].team1,
                //         home: res_bettings.rows[x].team2,
                //         status: status,
                //         place: res_bettings.rows[x].place
                //     });
                // } catch (error) {
                //     return;
                // }

            }
        }
    }
    
    await client.end();
}

autoBetSettle();