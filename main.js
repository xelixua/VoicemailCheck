var http 	= require('http');
var fs		= require('fs');
var mail	= require('./mail.js');

function send_push_request(ip,text){  //displays push message with text on phone's display			
			var date = new Date();
			var XML_feed='<?xml version="1.0"?><Response><Topline>'+text+'</Topline></Response>';

			fs.writeFile('/var/www/message.xml',XML_feed,function(err,data){
				if (err) throw err;

				fs.readFile('push.xml', function (err, data){
					var date = new Date();
					if (err) throw err;
	
					var encoded_data=encodeURIComponent(data);
	
					var output = 'XMLData='+encoded_data;
					var options = {
		        			hostname: ip,
					        port: 80,
					        path: '/forms/push',
					        method: 'POST',
						headers: {	
						   'Content-Length': Buffer.byteLength(output),
						}
					};
		
					var req = http.request(options, function(res) {
					  var date = new Date();
					  console.log(date);
					  res.setEncoding('utf8');
					});
	
					req.on('error', function(e){
					  var date = new Date();
					  console.log(date+': Problem with request: ' + e.message);
					});
	
					req.write(output);
					req.write(data);
				});
			});
		}


mail.get_message_count('1001',function(text){
					var date = new Date();
					console.log(date+': Ext1001: Push "'+text+'" to phone');
					send_push_request('192.168.1.2',text);
			});

mail.state.on('1001MailChecked',function(){
        mail.get_message_count('1001',function(text){
                                        var date = new Date();
                                        console.log(date+': Ext1001: Push "'+text+'" to phone');
                                        send_push_request('192.168.1.2',text);
                        });

                });

mail.get_message_count('1002',function(text){
                                        var date = new Date();
                                        console.log(date+': Ext1002: Push "'+text+'" to phone');
                                        send_push_request('192.168.1.2',text);
                        });


mail.state.on('1002MailChecked',function(){
	mail.get_message_count('1002',function(text){
				 	var date = new Date();
                                        console.log(date+': Ext1002: Push "'+text+'" to phone');
                                        send_push_request('192.168.1.3',text);
                        });

		});


