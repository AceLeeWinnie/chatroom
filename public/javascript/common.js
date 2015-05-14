      var socket = io.connect('127.0.0.1:3000');
      jQuery(function($){
            /*
                  登录
             */
      	//获取表单
      	var loginForm = $('#login-form');
      	//获取文本框
      	var nicknameSet = $('#nickname-set');
      	loginForm.submit(function(event){
      		event.preventDefault();
      		//向服务器端发送昵称信息
      		socket.emit('nickname',nicknameSet.val(),function(data){
      			//回调为真
      			if(data){
      				$('#login').hide();
      				$('#chatroom').show();
      				$('#user').text(nicknameSet.val());
      			}else{
      				$('#loginError').text('This nickname is illegal');
      			}
      		});
      	});
      	/*
                  发送消息
             */
      	var messageForm = $('#message-form');
      	var messageSend = $('#message-send');
      	messageForm.submit(function(e){
      		e.preventDefault();
      		//向服务器发送消息
      		socket.emit('message',messageSend.val());
      		//清空发送框并锁定
      		messageSend.val('').focus();
      	});
      	/*
            
             接收消息

            */
      	var messageList = $('#message-list');
      	socket.on('message',function(data){
                  data = data.sendInfo;
      		var msgSendHtml ='<strong>'+data.from+'</strong> in '+data.time+' say: ';
      		messageList.append('<p>'+msgSendHtml+'<br>'+data.text+'</p>');
      	});
      	/*
                  接收系统信息
             */
      	//昵称表单
      	var userList = $('#nickname-list').find('ul').first();
      	var count = $('#nickname-list').find('span').first();
      	var sysInfo = $('#sys-info');
      	socket.on('system',function (data){
      		count.text('count:'+data.count);
      		//清空列表
      		userList.html('');
      		//重载昵称列表
      		for(var i = 0;i<data.nicknames.length;i++){
                        var ali = $('<li/>');
                        ali.html(data.nicknames[i]);
      			userList.append(ali);
                        if(data.nicknames[i]!=$('#user').text()){
                           sendPersonal(ali);   
                        }
                        
      		}
      		sysInfo.text(data.text);
      		setTimeout("$('#sys-info').html('')",1000);

      	});
             /*
                  私信功能
             */
            socket.on('privateMessage',function (data) {
                  data = data.sendInfo;
                  var msgSendHtml ='<strong>'+data.from+'</strong> send to '+data.to+' in '+data.time+' say: ';
                  messageList.append('<p>'+msgSendHtml+'<br>'+data.text+'</p>');
            });
            //为各昵称添加事件
            function sendPersonal(obj){
                  obj.on('dblclick',function () {
                        messageSend.val('Send to '+obj.html()+':').focus();
                  });
            }
      });