var request = require('request'),
	fs = require('fs'),
	csvWriter = require('csv-write-stream'),
	writer = csvWriter(),
	api_key = require('./secret');

var totalReq = 100;
	resReceived = 0;

var requestBody = {
	'request':{
		"passengers":{
			"adultCount":1
		},
		'slice':[
			{
				"origin":"BOS",
				"destination":"SFO",
			}
		],
		'solutions':20
	}
}; //https://developers.google.com/qpx-express/v1/requests

//Output writable stream
var output = fs.createWriteStream(__dirname+'/output.csv',{flags:'a'});
writer.pipe(output);

console.log('Scrape QPX api...');

for(var startDate = new Date(2015,10,15),i=0; i<totalReq; i++){
	//travel date
	//for each travel date, issue a request
	var travelDate = new Date(startDate.getTime() + i*1000*60*60*24);

	setTimeout(function(newDate){

		var requestBody = {
			'request':{
				"passengers":{
					"adultCount":1
				},
				'slice':[
					{
						"origin":"BOS",
						"destination":"SFO",
						"date":newDate.getFullYear() + '-' + (newDate.getMonth()+1) + '-' + newDate.getDate()
					}
				],
				'solutions':20
			}
		}; //https://developers.google.com/qpx-express/v1/requests

		console.log('looking up trips for ' + newDate.toUTCString());

		request({
				method:'POST',
				url: 'https://www.googleapis.com/qpxExpress/v1/trips/search?key='+api_key,
				headers:{
					"name":"content-type",
					"value":"application/json"
				},
				json:true,
				body:requestBody
			}, function(err,res,body){
				if(err){
					console.error(err);
					resReceived += 1;
					return;
				}else{
					resReceived += 1;
				}

				if(!body.trips || !body.trips.tripOption){
					console.log(body.trips);
					return;
				}
				var options = body.trips.tripOption; //for each travel date, an array of 20 options
				options.forEach(function(option){
					writer.write({
						'id':option.id,
						'price':(option.saleTotal).slice(3),
						'airline':option.pricing[0].fare[0].carrier,
						'duration':option.slice[0].duration,
						'travelDate': newDate.toUTCString(),
						'lookupDate':(new Date()).toUTCString()
					});
				});

				console.log("Response received: " + resReceived + " for date " + newDate.toUTCString());

				if(resReceived == totalReq){
					writer.end();
					console.log('Output finished');
				}

			});
	},i*105,travelDate);

}

