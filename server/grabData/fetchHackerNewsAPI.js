var async = require('async');
var request = require('request');
var unfluff = require('unfluff');

const scrapedData = require('../models/scrapedData');


///////////////////////////////////////////////////////////////
// Grab data from HackerNews API
///////////////////////////////////////////////////////////////

function fetchHackerNewsAPI() {

	// scrapedData.remove({}, function(err,removed) {
	// });
	console.log("Request to Hacker News API started");

	const topics = ['javascript', 'redux+react', 'perl', 'python', 'ruby', 'angular'];

	topics.forEach(function(topic){
		const url = `https://hn.algolia.com/api/v1/search_by_date?query=${topic}&hitsPerPage=300&tags=story`
		const results = [];
		request(url, function(error, response, body) {
			const data = JSON.parse(body);
			const items = data.hits;
			let story = {};

			items.forEach(item => {
				const pageUrl = item.url;
				const date = item['created_at'].match(/(\d{4})-(\d{2})-(\d{2})/g);
				const hn_title = item.title;
				const points = item.points;

				if(pageUrl !== null){
					if(pageUrl.indexOf("https://github.com", 0) === -1 ) {
						story = {
							date, hn_title, points, pageUrl, topic
						}
						results.push(story)
					}
				}
			});

			fetchHTML(results);
		});
	});

};

///////////////////////////////////////////////////////////////
// Scrape data from individual Urls
///////////////////////////////////////////////////////////////

function fetchHTML(results) {
	results.forEach(function(result){

		// Call to each URL pulled from HackerNews
		request(result.pageUrl, function (error, res, body) {
			let isBlocked = "No";
			if(error) {
				console.log("error", error);
			}
			// If the page was found...
			else if (!error && res.statusCode == 200) {

			    // Grab the headers
			    var headers = res.headers;

			    // Grab the x-frame-options header if it exists
			    var xFrameOptions = headers['x-frame-options'] || '';

			    // Normalize the header to lowercase
			    xFrameOptions = xFrameOptions.toLowerCase();

			    // Check if it's set to a blocking option
			    if (
			      xFrameOptions === 'sameorigin' ||
			      xFrameOptions === 'deny'
			    ) {
			      isBlocked = "Yes";
			    }
			}

			// Pull out content from each link
			let unfluffed;
			try {
				unfluffed = unfluff(body)
			}
			catch(e) {
				// console.log(e)
			}
			
			if(unfluffed) {
				// Grabbing the original URL for a poss linkback
				const orig_url = result.pageUrl;

				// What topic was being searched
				const topic = result.topic;
			
				// Current Points on Hacker News
				const points = result.points;
			
				// Grab the date the article was posted on HackerNews
				const date = dateFormat(result.date);
			
				// Grab story title if it has one.
				let title = unfluffed.title;
				title = (title && title !== "400 Bad Request") ? title : false;
				title = title ? title : result.hn_title;
			
				// Grab story description if there is one
				const desc = unfluffed.description;
			
				// Grab image
				let img = unfluffed.image ? unfluffed.image : "noimage"

				if (img == "http://www.syntaxsuccess.com/img/bio.jpg") {
					img = "noimage";
				}
				// console.log("IMAGE TAG!", img)
				// "https://placeholdit.imgix.net/~text?txtsize=33&txt=256%C3%97180&w=256&h=180";
			
				// Create unique story id from stripped and shortened url
				const story_id = result.pageUrl.replace(/[^a-z0-9]+/ig, "").substring(5, 40);

				// Clean up the url for front end design
				const display_url = result.pageUrl.split('/')[2].replace(/www./i, '')
		
				// Get a word count of the story's description
			   	const desc_words = desc ? desc.split(' ').length : false
			   
			   	// Make sure the description is long enough for front end design
			   	const desc_check = desc_words > 7 ? desc_words : false
			   
			   	// Grab first 200 chars of text from article
			   	const text = unfluffed.text
			   			   ? unfluffed.text.substring(0, 200).replace(/\n\n/g, ' ') 
			   			   : false

			   	// Word Length of text from sraped page
			   	const text_words = unfluffed.text ? unfluffed.text.split(' ').length: false;
			   
			   	// How long will it take a user to read this story?
		   	    const mins = Math.ceil(unfluffed.text.split(' ').length / 250)

		   	    // Make sure the story is long enough to be worth reading
		   	    const mins_check = mins > 1 ? mins + " Min Read" : false
		   	   
		   	    const story = {
		   	    	story_id, orig_url, topic, date, title, desc, img,
		   	    	display_url, text, mins_check, points, text_words, isBlocked
		   	    }
		   	    if(isBlocked === "No") {

			   	    if(Object.keys(story).every(key => story[key])) {
		   	    	    // console.log("STORY_ID!!!!!", story.story_id);
			   	    	scrapedData.count({story_id: story.story_id}, function (err, count){ 
			   	    	
			   	    	    if(!count) {
			    	    		scrapedData.create(story, function (err, savedStory) {
				    	    		// console.log("STORY_ID!!!!!", story.story_id);
				    	    		// console.log("Count", count, story.story_id)
				    	    		
				    	    		if (err) {
				    	    			// console.log(err);
				    	    		}
			    	    			// console.log("+++NOT IN DB++++SAVING NOW++++");
			    	    	    })
			   	    	    }
			   	    	}); 
			   	    		
			   	    }
		   		}
	   		}
		
		});
	});
	scrapedData.count({}, function(err, count){
	    // console.log( "TOTAL Number of docs: ", count );
	});
	console.log("Request 1 of 6 ... done")
};


///////////////////////////////////////////////////////////////
// Modify date format to show MM/DD/YYYY
///////////////////////////////////////////////////////////////

function dateFormat(inputDate) {
    var date = new Date(inputDate);
        var day = date.getDate().toString();
        var month = (date.getMonth() + 1).toString();
        // Months use 0 index.
        return (month[1] ? month : '0' + month[0]) + '/' +
           (day[1] ? day : '0' + day[0]) + '/' + 
           date.getFullYear();
};


module.exports = fetchHackerNewsAPI;