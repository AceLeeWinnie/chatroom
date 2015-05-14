/**
 * 服务器端
 */
var express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	socketio = require('socket.io'),
	http = require('http');
	//日志
var logger = require('morgan');

/*
	socketio接入传输流
 */
var app = express(),
	server = http.createServer(app),
	io = socketio(server);

//设置模板引擎地址
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//记录日志
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//公共文件夹
app.use(express.static(path.join(__dirname, 'public')));
//在线人数统计
var count=0;
//昵称对象 可以使用索引 并且存储该socket
var nicknames={};
/*
	登陆前
 */
//第一次请求 需填写昵称
app.get('/',function  (req,res) {
	//使用登陆界面渲染
	res.render('index');
});
/*
	登陆后
 */
io.on('connection',function (socket){
	console.log('socket.io connected');
	/*
		连接后再将昵称从服务器返回 确认用户确实登陆
	*/
	socket.on('nickname',function  (nickname,callback) {
		//如果昵称存在列表中或者为空
		if(nicknames[nickname] || !nickname){
			//回调为false
			callback(false);
		}else{

			callback(true);
			socket.nickname = nickname;
			//保存昵称和会话
			nicknames[nickname] = socket;
			//增加人数
			++count;
			console.log('socket.io nickname: '+nickname+' count:'+count);
			//实时更新昵称列表和人数信息
			updateinfo(socket,nickname+' come in '+new Date().toLocaleTimeString());
		}
	});
	/*
		客户端发来消息
	 */
	socket.on('message',function  (message) {
		//发送信息
		var sendInfo,result;
		//消息不为空 继续处理
		if(message){
			console.log(message);
			//初始化消息相关信息
			sendInfo = {};
			//如果是匹配sendto的,私信
			if(message.match(/^[Ss]end\s[Tt]o\s\w+:/)){
				//分割消息消息体 不能用这个 可能内容中包含：
				result = message.split(':');
				//获取消息内容
				sendInfo.text = result[1];	
				//收件人
				sendInfo.to = result[0].split(' ')[2];
				//发件人
				sendInfo.from = socket.nickname;

			}else{
				//群聊
				if(sendInfo.to){
					delete sendInfo.to;
				}
				sendInfo.text = message;
				sendInfo.from = socket.nickname;
			}
			sendInfo.time = new Date().toLocaleTimeString();
			//发送到客户端
			updatemsg(sendInfo);
		}else{
			//消息为空 不处理
			return;
		}
	});
	/*
		连接断开 昵称从昵称列表删除 人数减一
	*/
	socket.on('disconnect',function () {
		//如果昵称不存在 则返回
		if(!socket.nickname){
			return;
		}else{
			//昵称存在 删除昵称
			delete nicknames[socket.nickname];
			//减少人数
			--count;
			//实时更新 退出时间
			updateinfo(socket,socket.nickname+' leave in '+new Date().toLocaleTimeString());
		}
		console.log('socket.io disconnect '+socket.nickname);

	});
});

//系统通知模块 实时更新进入与退出 传入消息内容即可
function updateinfo (socket,msg) {
	//保存昵称 不能将socket带到客户端去
	var names = [];
	for(var name in nicknames){
		names.push(name);
	}
	socket.broadcast.emit('system',{text:msg,nicknames:names,count:count});
	socket.emit('system',{text:msg,nicknames:names,count:count});
}
//信息模块 传递发信人昵称与时间
function updatemsg (sendInfo) {
	if(sendInfo.to){
		//私信
		nicknames[sendInfo.to].emit('privateMessage',{sendInfo:sendInfo});
		nicknames[sendInfo.from].emit('privateMessage',{sendInfo:sendInfo});
	}else{
		//广播
		nicknames[sendInfo.from].broadcast.emit('message',{sendInfo:sendInfo});
		nicknames[sendInfo.from].emit('message',{sendInfo:sendInfo});
	}
}
server.listen(3000,function  () {
	console.log('listen on 3000');
});
   
