require('dotenv').config()
const axios = require("axios");
const { dateToString, getDiffernceDateWithMin } = require('../function/time');
const { WebClient } = require('@slack/web-api');
const { Client } = require('pg');

// Initialize a Slack client with your bot's token.
const slackClient = new WebClient(process.env.LINEUP_TOKEN);


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

exports.slackNote = async() => {

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
    var res = await client.query(`SELECT * FROM odds_table WHERE state != '2' AND game_date = '${gamedate}' ORDER BY start_time ASC;`);

    if(res.rows != undefined) {
        for(var x = 0; x < res.rows.length; x++) {
            var startime = new Date(res.rows[x].start_time);
            if(getDiffernceDateWithMin(currentTime, startime) != -1) {
                try {
                    var response = await axios.post('http://127.0.0.1:5000/getLineupStatus', {
                            gameid: res.rows[x].game_id,
                        });
                } catch (error) {
                    await client.end();
                    return;
                }

                if(response.data != undefined) {
                    if (response.data.away != 0 || response.data.home != 0 ) {
                        var message = `${res.rows[x].away} @ ${res.rows[x].home}\n${res.rows[x].away} ${response.data.away == 1 ? checkmark: crossmark}\n${res.rows[x].home} ${response.data.home == 1 ? checkmark: crossmark}`;
                        if(response.data.away != 0 && response.data.home != 0)
                            var respond = await client.query(`UPDATE odds_table SET state = '2' WHERE game_id = '${res.rows[x].game_id}';`);
                        else
                            var respond = await client.query(`UPDATE odds_table SET state = '1' WHERE game_id = '${res.rows[x].game_id}';`);
                        
                        if(response.data.away != 0 && response.data.home != 0 || res.rows[x].state == 0)
                            await sendMessage(process.env.SLACK_LINEUP_ID, message);
                        }
                    }
                }
            }
        }
    await client.end();
}