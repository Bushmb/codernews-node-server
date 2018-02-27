const schedule = require('node-schedule');
const fetchHackerNewsAPI = require('./fetchHackerNewsAPI');
const scrapedData = require('../models/scrapedData');

const scheduleData = {
	scheduleJob: function() {
		let count = 0;
		// wiping database to only show latest articles //

		scrapedData.remove({}, function(err,removed) {
		console.log("Clearing DB");
		});

		// Run on initial load //

		fetchHackerNewsAPI();
		console.log("Job # " + count);
		count++;

		// this rule is standard cron syntax for 
		// once every 15 mintues.
		const rule = '*/15 * * * *';
		
		const job = schedule.scheduleJob(rule, function() {

			// wiping database to only show latest articles //
			// scrapedData.remove({}, function(err,removed) {
			// console.log("Clearing DB");
			// });
			
			// Run request to fetch new data //

			fetchHackerNewsAPI();

			console.log("Job # " + count);
			count++;
			
		});
	},

	init: function() {
		scheduleData.scheduleJob();
	}
};

module.exports = scheduleData;

