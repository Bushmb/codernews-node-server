const schedule = require('node-schedule');
const fetchHackerNewsAPI = require('./fetchHackerNewsAPI');
const scrapedData = require('../models/scrapedData');

const scheduleData = {
	scheduleJob: function() {

		// wiping database to only show latest articles
		// scrapedData.remove({}, function(err,removed) {
		// console.log("Clearing DB");
		// });

		// run on initial load
		// fetchHackerNewsAPI();

		// this rule is standard cron syntax for 
		// once every 15 mintues.
		const rule = '*/15 * * * *';
		
		const job = schedule.scheduleJob(rule, function() {

			// wiping database to only show latest articles
			// scrapedData.remove({}, function(err,removed) {
			// console.log("Clearing DB");
			// });
			
			// // run request to fetch new data
			fetchHackerNewsAPI();
			
		});
	},

	init: function() {
		scheduleData.scheduleJob();
	}
};

module.exports = scheduleData;

