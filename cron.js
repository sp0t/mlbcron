const cron = require('node-cron');
const { autoBetSettle } = require('./jobs/autoBetSettle')
const { autoBetPlace } = require('./jobs/autoBetPlace')
const { saveOdds } = require('./jobs/saveOdds')
const { slackNote } = require('./jobs/slackNote')
const { update } = require('./jobs/update')
const { sendOdds } = require('./jobs/sendOdds')

const task1 = cron.schedule('*/20 * * * *', () => {
    autoBetSettle();
}, {
  scheduled: true
});

// const task2 = cron.schedule('*/2 * * * *', () => {
//     saveOdds();
// }, {
//   scheduled: true
// });

const task3 = cron.schedule('*/15 * * * * *', () => {
  slackNote();
}, {
  scheduled: true
});

const task4 = cron.schedule('*/30 * * * *', () => {
    update();
}, {
  scheduled: true
});

const task5 = cron.schedule('*/2 * * * *', () => {
  autoBetPlace();
}, {
scheduled: true
});

const task6 = cron.schedule('*/4 * * * * *', () => {
  console.log('task6.....started');
  sendOdds();
}, {
scheduled: true
});

task1.start();
// task2.start();
task3.start();
task4.start();
task5.start();
task6.start();

console.log('Cron jobs have been initialized');