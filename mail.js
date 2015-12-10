//checking number of messages on Communication Manager Messaging
var Imap         = require('imap');
var inspect      = require('util').inspect;
var emitter      = require('events').EventEmitter;

var state = new emitter;

var emit_timer = 5000;

function get_message_count(extension,send_push){
	var date = new Date();
        var imap = new Imap({
                user: extension,
                password: '1234',
                host: '192.168.1.100',
                port: 143,
                tls: false,
        });

        imap.connect();

        imap.on('ready',function(){
		var date = new Date();
		console.log(date);		
		console.log(date+': Ext'+extension+': Mailbox CONNECTED');
                imap.status('inbox',function(err,mailbox){
			var date = new Date();
			var new_mesg=mailbox.messages.unseen;
			var total_mesg=mailbox.messages.total;
			var temp_seqno=0;
			var update_timeout;
			var update_data = [];
			imap.on('close',function(){
				var date = new Date();
				console.log(date+': Ext'+extension+': Mailbox DISCONNECTED');
			});
			imap.on('update',function(seqno,info){	// emitted when checked with external e-mail client
				var date = new Date();
				var first_flag=info.flags[0];
				if(info.flags[1]) var second_flag = info.flags[1];
				console.log(date+': Ext'+extension+': UPDATE seqno '+seqno+'\n'+date+': UPDATE info.flags: '+JSON.stringify(info.flags));

				if(seqno>temp_seqno){  //check if it's last update
					temp_seqno=seqno;
					update_data.push(info);
					console.log(date+': Ext'+extension+': --Updating seqno');
				        if (update_timeout) {clearTimeout(update_timeout); console.log(date+': Ext'+extension+': ----clear timeout')};
					update_timeout = setTimeout(function(){
						var date = new Date();
						console.log(date+': Ext'+extension+': --------timeout UPDATING COUNTERS');
						temp_seqno=0;
						var first_flag,second_flag,temp_info;	
						for(i=update_data.length;i>0;i--){
							temp_info=update_data.pop();
							first_flag=temp_info.flags[0];
							if (temp_info.flags[1]) second_flag=temp_info.flags[1];
							date = new Date();
							switch(first_flag){
								case "\\Seen":{
									new_mesg--;
									console.log(date+': Ext'+extension+': ----------Message #'+i+' flags: '+first_flag);
									break;
								}
								case "\\Deleted":{
									if(i<=new_mesg){
										new_mesg--;
										total_mesg--;
										console.log(date+': Ext'+extension+': ----------Message #'+i+' flags: '+first_flag);
									}
									else{
										total_mesg--;
										if(second_flag && new_mesg>0) new_mesg--;
									}
								}
							}
						}
						var message_to_push = 'New/Unopened = '+new_mesg+' Total = '+total_mesg;
						send_push(message_to_push);
						console.log(date+': Ext'+extension+': UPDATE push message "'+message_to_push+'"');
						},500);
						console.log(date+': Ext'+extension+': ------timeout set');
				}


			});
			imap.openBox('inbox',true,function(err,box){
						var date = new Date();
        	                                if (err) throw err;
						imap.on('mail',function(numNewMsgs){
								NewMail(numNewMsgs,new_mesg,total_mesg,imap,box,send_push,extension);
							});
						
						var message_to_push = 'New/Unopened = '+new_mesg+' Total = '+total_mesg;
	                                        GetCLID(imap,total_mesg,box,message_to_push,send_push);
					});
			});
		});
};

function NewMail(numNewMsgs,new_mesg,total_mesg,imap,box,send_push,extension){
         var date = new Date();
         new_mesg+=numNewMsgs;
         var n=new_mesg;
         switch(n){
                   case 0:{
        	           var messages = 'You have no new messages';
	                   break;
                          }
                   case 1:{
                           var messages = 'You have one new message';
	                   break;
                          }
                   default:{
                            var messages = 'You have '+n+' new messages';
                            break;
         	           }
                   }
          GetCLID(imap,total_mesg,box,messages,send_push);
          imap.closeBox(function(){
 	                             imap.end();
                                     setTimeout(function(){
                                     var date = new Date();
                                     state.emit(extension+'MailChecked')},emit_timer);
                         });
}


function GetCLID(imap,total_mesg,box,message,send_push){
	var CLID;
	var date = new Date();
	if((total_mesg!=0) && box){
	var f = imap.seq.fetch(box.messages.total+':*',{bodies:['HEADER.FIELDS (FROM)']});
        f.on('message',function(msg,seqno){
		 var date = new Date();
       		  msg.on('body',function(stream,info){
			   var date = new Date();
                            var buffer = '';
                            stream.on('data',function(chunk){
                                                buffer+=chunk.toString('utf8');
                                             });
                            stream.once('end',function(){
						    var date = new Date();
            			                    var FromNumb = JSON.stringify(Imap.parseHeader(buffer).from).split('"')[2].slice(0,-1);
						    CLID = FromNumb;
						    if(message!='You have one new message'){
							send_push(message+' Last from '+CLID);
						    }
						    else{
							send_push(message+' from '+CLID);
						    }
                                              });
                	         });
                         });
         f.once('error',function(err){
		            var date = new Date();
                            console.log(date+': Ext'+extension+': Fetch error: '+err);
                         });
	}
	else{
		send_push(message);
	}
};

exports.get_message_count = get_message_count;
exports.state = state;
