require('dotenv').config()
const axios = require("axios");
const { dateToString, getDiffernceDateWithMin } = require('../function/time');
const { WebClient } = require('@slack/web-api');
const { Client } = require('pg');

// Initialize a Slack client with your bot's token.
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

    console.log(gamedate)

    await client.connect();
    var res = await client.query(`SELECT * FROM odds_table WHERE state != '1' AND game_date = '${gamedate}' ORDER BY start_time ASC;`);

    if(res.rows != undefined) {
        for(var x = 0; x < res.rows.length; x++) {
            console.log(res.rows[x], currentTime)
            if(getDiffernceDateWithMin(currentTime, res.rows[x].start_time) != -1 && getDiffernceDateWithMin(currentTime, res.rows[x].start_time) > 120) {
                try {
                    var response = await axios.post('http://127.0.0.1:5000/getLineupStatus', {
                            gameid: res.rows[x].game_id,
                        });
                } catch (error) {
                    return;
                }

                if(response.data != undefined) {
                    if (response.data.away != 0 && response.data.home != 0 ) {
                        var message = `${res.rows[x].away} @ ${res.rows[x].home}\n${res.rows[x].away} ${response.data.away == 1 ? checkmark: crossmark}\n${res.rows[x].home} ${response.data.home == 1 ? checkmark: crossmark}`;
                        var response = await client.query(`UPDATE odds_table SET state = '1' WHERE game_id = '${res.rows[x].game_id}';`);
                        await sendMessage(process.env.SLACK_CHANNEL_ID, message);
                    }
                }
            }
        }
    }

    await client.end();
}