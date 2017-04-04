const schedule = require('node-schedule');
// const mongoose = require('mongoose');
const fetchHackerNewsAPI = require('./fetchHackerNewsAPI');
const scrapedData = require('../models/scrapedData');

const scheduleData = {
	scheduleJob: function() {

		// run on initial load
		fetchHackerNewsAPI();

		// this rule is standard cron syntax for 
		// once every 15 mintues.
		const rule = '*/15 * * * *';
		
		const job = schedule.scheduleJob(rule, function() {

			// wiping database to only show latest articles
			scrapedData.remove({}, function(err,removed) {
			console.log("Clearing DB");
			});
			
			// run request to fetch new data
			fetchHackerNewsAPI();
			
		});
	},

	init: function() {
		scheduleData.scheduleJob();
	}
};

// function getDateTime() {

//     var date = new Date();

//     var hour = date.getHours();
//     hour = (hour < 10 ? "0" : "") + hour;

//     var min  = date.getMinutes();
//     min = (min < 10 ? "0" : "") + min;

//     var sec  = date.getSeconds();
//     sec = (sec < 10 ? "0" : "") + sec;

//     var year = date.getFullYear();

//     var month = date.getMonth() + 1;
//     month = (month < 10 ? "0" : "") + month;

//     var day  = date.getDate();
//     day = (day < 10 ? "0" : "") + day;

//     return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

// }

module.exports = scheduleData;

