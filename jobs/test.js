const axios = require("axios");
const { Client } = require('pg');
const { getDiffernceDateWithHour, addOneDayToDate } = require('../function/time');

const update = async() => {
    try {
        var response = await axios.post('http://127.0.0.1:5000/getWinStatus', {
            gameid: '746418',
        });
    } catch (error) {
        return;
    }

    console.log(response)
}


update();