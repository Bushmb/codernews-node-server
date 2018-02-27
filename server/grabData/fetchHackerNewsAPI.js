var request = require('request');
var unfluff = require('unfluff');

const scrapedData = require('../models/scrapedData');

///////////////////////////////////////////////////////////////
// Grab data from HackerNews API
///////////////////////////////////////////////////////////////

function fetchHackerNewsAPI() {
	
	// let dateString = new Date();
	console.log("Request to Hacker News API started @ " + new Date());

	const topics = ['javascript', 'redux+react', 'perl', 'python', 'ruby', 'angular'];
	const finalResults = [];

	topics.forEach( function(topic){
		const url = `https://hn.algolia.com/api/v1/search_by_date?query=${topic}&hitsPerPage=40&tags=story`
		
		request(url, function(error, response, body) {
			const data = JSON.parse(body);
			const items = data.hits;
			let story = {};
			const results = []

			items.forEach(item => {
				const pageUrl = item.url;
				const date = item['created_at'].match(/(\d{4})-(\d{2})-(\d{2})/g);
				const hn_title = item.title;
				const points = item.points;

				if(pageUrl !== null){
					if(pageUrl.indexOf("https://github.com", 0) === -1 
					&& pageUrl.indexOf("https://twitter.com", 0) === -1 
						&& pageUrl.indexOf("https://docs.google.com", 0) === -1 
						&& pageUrl.indexOf("https://www.smartly.io", 0) === -1 ) {
						story = {
							date, hn_title, points, pageUrl, topic
						}
						results.push(story);
					}
				}

			});

			finalResults.push(results)

			if(finalResults.length === topics.length) {
				const concated = finalResults.reduce((newArr, arr) => {
					newArr = newArr.concat(arr)
					return newArr
				}, [])
				fetchHTML(concated);	
			}

		});
	});	
};

function fetchHTML(results) {

	const numResults = results.length;
	function makeRequest(story) {

		// let dateString = new Date();
		console.log(`${new Date()} - ${numResults - results.length} of ${numResults}`);

			request(story.pageUrl, function(err, res, body) {
				if(err || res || body) {
						if(results.length) {
							makeRequest(results.pop());	
						} else {
							console.log("All Requests Finished @ " + new Date());
							return;
						}
				}
				if(body && !err && res.statusCode == 200) {
				 	refineStory(story, body, res);
				} 
			})	
	}
	makeRequest(results.pop());
}


///////////////////////////////////////////////////////////////
// Scrape data from individual Urls
///////////////////////////////////////////////////////////////


function refineStory(indivStory, body, res) {

	let isBlocked = "No";
			
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
			
	// Pull out content from each link
	let unfluffed;
	try {
		unfluffed = unfluff(body);
	}
	catch(e) {
		// console.log(e)
	}
				
	if(unfluffed) {
		// Grabbing the original URL for a poss linkback
		const orig_url = indivStory.pageUrl;

		// What topic was being searched
		const topic = indivStory.topic;
	
		// Current Points on Hacker News
		const points = indivStory.points;
	
		// Grab the date the article was posted on HackerNews
		const date = indivStory.date;

		// Copy of date for display purposes
		const dispDate = dateFormat(indivStory.date)
	
		// Grab story title if it has one.
		let title = unfluffed.title;
		title = (title && title !== "400 Bad Request") ? title : false;
		title = title ? title : indivStory.hn_title;
	
		// Grab story description if there is one
		const desc = unfluffed.description;
	
		// Grab image
		let img = unfluffed.image ? unfluffed.image : "noimage"

		if (img == "http://www.syntaxsuccess.com/img/bio.jpg") {
			img = "noimage";
		}
	
		// Create unique story id from stripped and shortened url
		const story_id = indivStory.pageUrl.replace(/[^a-z0-9]+/ig, "").substring(5, 40);

		// Clean up the url for front end design
		const display_url = indivStory.pageUrl.split('/')[2].replace(/www./i, '')

		// Get a word count of the story's description
	   	const desc_words = desc ? desc.split(' ').length : false
	   
	   	// Make sure the description is long enough for front end design
	   	const desc_check = desc_words > 7 ? desc_words : false
	   
	   	// Grab first 200 chars of text from article
	   	const text = unfluffed.text
	   			   ? unfluffed.text.substring(0, 400).replace(/\n\n/g, ' ') 
	   			   : false

	   	// Word Length of text from sraped page
	   	const text_words = unfluffed.text ? unfluffed.text.split(' ').length: false;
	   
	   	// How long will it take a user to read this story?
   	    const mins = Math.ceil(unfluffed.text.split(' ').length / 250)

   	    // Make sure the story is long enough to be worth reading
   	    const mins_check = mins > 1 ? mins + " Min Read" : false
   	   
   	    const story = {
   	    	story_id, orig_url, topic, date, dispDate, title, desc, img,
   	    	display_url, text, mins_check, points, text_words, isBlocked
   	    }
   	    if(isBlocked === "No") {

	   	    if(Object.keys(story).every(key => story[key])) {
   	    	   
	   	    	scrapedData.count({story_id: story.story_id}, function (err, count){ 
	   	    	
	   	    	    if(!count) {
	    	    		scrapedData.create(story, function (err, savedStory) {
		    	    		
		    	    		if (err) {
		    	    			// console.log(err);
		    	    		}
	    	    			console.log("+++SAVING NEW STORY+++");
	    	    	    })

	   	    	    }
	   	    	    // console.log("+++IN DATABASE+++");
	   	    	}); 
	   	    		
	   	    }
   		}
	}
		   	
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