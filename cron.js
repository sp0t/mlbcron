const cron = require('node-cron');
const { autoBetSettle } = require('./jobs/autoBetSettle')
const { saveOdds } = require('./jobs/saveOdds')
const { slackNote } = require('./jobs/slackNote')
const { update } = require('./jobs/update')

const task1 = cron.schedule('*/5 * * * *', () => {
    autoBetSettle();
}, {
  scheduled: true
});

const task2 = cron.schedule('*/2 * * * *', () => {
    saveOdds();
}, {
  scheduled: true
});

const task3 = cron.schedule('*/1 * * * *', () => {
    slackNote();
}, {
  scheduled: true
});

const task4 = cron.schedule('*/30 * * * *', () => {
    update();
}, {
  scheduled: true
});

task1.start();
task2.start();
task3.start();
task4.start();

console.log('Cron jobs have been initialized');