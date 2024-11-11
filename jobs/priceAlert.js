require('dotenv').config()
const axios = require("axios");
const { Client } = require('pg');
const { genToken, generateUUID } = require('../function/credential');
const { WebClient } = require('@slack/web-api');

const slackClient = new WebClient(process.env.PRICE_TOKEN);

const sendMessage = async(channelId, messageText) => {
    try {
        const response = await slackClient.chat.postMessage({
            channel: channelId,
            text: messageText, // Always include a 'text' parameter for fallback purposes.
            // Add other parameters as needed, like 'blocks' for structured layout
        });

        console.log("Message sent successfully", response.ts);
        return;
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

exports.priceAlert = async() => {
    var token = genToken();

    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'betnhl_new',
        password: 'lucamlb123',
        port: 5432,
    })

    await client.connect();
    var res = await client.query(`SELECT * FROM price_table INNER JOIN schedule ON price_table.game_id = schedule.game_id WHERE price_table.status = '0';`);
    console.log(res.rows);
    if(res.rows != undefined && res.rows.length > 0 ) {
        price_request = res.rows;

        for(var z in price_request) {
            price_request[z].away_full_name = price_request[z].away_full_name
            .replaceAll('å', 'a')
            .replaceAll('ä', 'a')
            .replaceAll('ö', 'o')
            .replaceAll('ü', 'u')
            .replaceAll('é', 'e')
            .replaceAll('è', 'e')
            .replaceAll('janmark-nylen', 'janmark')
            .replaceAll('iakovlev', 'yakovlev')
            .replaceAll('vorobyov', 'vorobyev')
            .replaceAll('\x1A', 'c');

            price_request[z].home_full_name = price_request[z].home_full_name
            .replaceAll('å', 'a')
            .replaceAll('ä', 'a')
            .replaceAll('ö', 'o')
            .replaceAll('ü', 'u')
            .replaceAll('é', 'e')
            .replaceAll('è', 'e')
            .replaceAll('janmark-nylen', 'janmark')
            .replaceAll('iakovlev', 'yakovlev')
            .replaceAll('vorobyov', 'vorobyev')
            .replaceAll('\x1A', 'c');
        }

        var options = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            params: {
                sportId: 19,
                leagueIds: 1456,
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
            for (var y in games) {
                if(games[y].id != undefined && games[y].id == events[x].id)
                    if(games[y].periods != undefined && games[y].periods[0].moneyline != undefined) {
                        if(games[y].periods[0].moneyline.away != undefined && games[y].periods[0].moneyline.home != undefined)
                            for (var k in price_request) {
                                if(price_request[k].away_full_name == events[x].away && price_request[k].home_full_name == events[x].home) {
                                    console.log(price_request[k].awaystate);
                                    if(events[x].away >= price_request[k].awayprice && price_request[k].awaystate == '0') {
                                        var message = `${events[x].away} @ ${events[x].home}\n The price you requested on ${events[x].away} (${price_request[k].awayprice}) is now available ${price_request[k].bet == 1? 'and autobet will bet as requested': ''}`;
                                        await sendMessage(process.env.SLACK_PRICE_ID, message);
                                        await client.query(`UPDATE price_table SET status = '1' WHERE game_id = '${price_request[k].game_id}';`);
                                        if(price_request[k].homestate == '1')
                                            await client.query(`UPDATE price_table SET awaystate = '1' WHERE game_id = '${price_request[k].game_id}';`);
                                    }

                                    if(events[x].home >= price_request[k].homeprice && price_request[k].homestate == '0') {
                                        var message = `${events[x].away} @ ${events[x].home}\n The price you requested on ${events[x].home} (${price_request[k].homeprice}) is now available ${price_request[k].bet == 1? 'and autobet will bet as requested': ''}`;
                                        await sendMessage(process.env.SLACK_PRICE_ID, message);
                                        await client.query(`UPDATE price_table SET homestate = '1' WHERE game_id = '${price_request[k].game_id}';`);
                                        if(price_request[k].awaystate == '1' || events[x].away >= price_request[k].awayprice )
                                            await client.query(`UPDATE price_table SET status = '1' WHERE game_id = '${price_request[k].game_id}';`);
                                    }
                                }
                        }
                    }
            }   
        }
    }

    await client.end();
}
