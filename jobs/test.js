const axios = require("axios");
const { Client } = require('pg');
const { getDiffernceDateWithHour, addOneDayToDate } = require('../function/time');

const update = async() => {
    try {
        var response = await axios.post('http://127.0.0.1:5000/showbetting', {
            gamedate: '2024-03-28',
            away: 'New York Yankees',
            home: 'Houston Astros',
            status: 2,
            place: 'New York Yankees'
        });
    } catch (error) {
        return;
    }
}


update();