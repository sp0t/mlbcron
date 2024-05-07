require('dotenv').config()
const axios = require("axios");
const { dateToString, getDiffernceDateWithMin } = require('../function/time');
const { WebClient } = require('@slack/web-api');
const { Client } = require('pg');

const slackClient = new WebClient(process.env.SLACK_TOKEN);


const sendMessage = async(channelId, messageText) => {
    try {
        const resp = await slackClient.conversations.join({
            channel: channelId,
        });

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

const update = async() => {
    const checkmark = ':white_check_mark:';
    const crossmark = ':x:';

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
    var res = await client.query(`SELECT * FROM odds_table WHERE auto_bet == '1' AND state == '2' game_date = '${gamedate}';`);

    if(res.rows != undefined) {
        for(var x = 0; x < res.rows.length; x++) {
            var startime = new Date(res.rows[x].start_time);
            console.log(res.rows[x]);
            if(getDiffernceDateWithMin(currentTime, startime) != -1) {
                try {
                    var response = await axios.post('http://127.0.0.1:5000/getTarget', {
                            gameid: res.rows[x].game_id,
                        });
                } catch (error) {
                    return;
                }

                
                if(response.data != undefined) {
                    console.log(response.data)
                }
            } else {
                var respond = await client.query(`UPDATE odds_table SET auto_bet = '0' WHERE game_id = '${res.rows[x].game_id}';`);
            }
        } 
    }
    await client.end();
}


update();