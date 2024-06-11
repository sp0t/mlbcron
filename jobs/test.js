require('dotenv').config()
const axios = require("axios");
const { dateToString, getDiffernceDateWithMin } = require('../function/time');
const { decimalToAmerican, americanToDecimal } = require('../function/odds');
const { Client } = require('pg');
const { genToken, generateUUID } = require('../function/credential');
const { randomUUID } = require('crypto');

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
    var stake_res = await client.query(`SELECT * FROM sato_stake_size WHERE status = '1';`);
    var stake_size = 1500;

    if(stake_res.rows != undefined && stake_res.rows.length > 0 ) {
        stake_size = stake_res.rows[0].stake;
    } else {
        stake_size = 1500;
    }

    console.log(stake_size)
  
    await client.end();
}


update();