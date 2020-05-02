require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();

token = process.env.TOKEN;

bot.login(token);

const recognized_commands = [
	"roll",
	"!roll",
	"/roll",
	"!r",
	"/r"
];

const is_valid_pool_regex = /^[0-9]*(d[0-9]+([dk][0-9]+)?)?$/;
const end_of_pool = /[\+\- ]/;
const separator = /[ ]/;

const checkAgainstAll = (func, arr, and) => {
	return arr.map(func).reduce((acc, val) => and ? acc & val : acc | val);
}

const isCommand = (msg) => {
	const content = msg.content.trim();
	return checkAgainstAll((command) => content.startsWith(command), recognized_commands, false);
}

const evaluatePool = (pool) => {
	if(is_valid_pool_regex.test(pool)) {
		//valid, so parse away.
		return 0;
	} else {
		//invalid, return 0.
		return 0;
	}
}

const handle = (msg) => {
	console.log(msg.content.trim());
	const content = msg.content.trim();
	const start_of_dice = content.search(/[0-9]/);
	if(start_of_dice === -1) {
		//error: no numbers between command and end of input
		msg.channel.send("Sorry, I didnt see a dice command in there.");
		return;
	}
	var i = start_of_dice;
	var pool_tokens = [];
	var operators = [];
	while(i < content.length) {
		var curr_token = "";
		while(i < content.length && !end_of_pool.test(content[i])) {
			curr_token += content[i];
			i++;
		}
		while(i < content.length && separator.test(content[i])) {
			i++;
		}
		pool_tokens.push(curr_token);
		if(i < content.length) {
			operators.push(content[i]);
			i++;
			while(i < content.length && separator.test(content[i])) {
				i++;
			}
		}
	}

	const errors = pool_tokens.filter((token) => !is_valid_pool_regex.test(token));
	const values = pool_tokens.map((token) => evaluatePool(token));

	var reply = "Found these tokens: [" + pool_tokens + "]!\n";
	reply += "Separated by these operators: [" + operators + "].";

	if(errors.length > 0) {
		reply += "\nBut, I didn't know what these were supposed to mean:";
		reply += "\n```"
		reply += errors.reduce((acc, val) => acc + "\n" + val);
		reply += "```\n";
		reply += "So, I replaced them with `0`.";
	}

	msg.channel.send(reply);
}

bot.on("ready", () => {
	console.log("started up!");
});

bot.on("message", msg => {
	if(isCommand(msg)) {
		handle(msg);
	}
});
