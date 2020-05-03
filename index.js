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

const rollDice = (num, size) => {
	var acc = 0;
	for(var i = 0; i < num; i++) {
		acc += parseInt(Math.random() * size + 1);
	}
	return acc;
}

const evaluatePool = (pool) => {
	if(is_valid_pool_regex.test(pool)) {
		//valid, so parse away.
		if(pool === "") {
			//technically fits the is_valid regex, so we'll just say its 0.
			return 0;
		} else if(/^[0-9]+$/.test(pool)) {
			//just a number, so parse it.
			return parseInt(pool);
		} else if(/^d[0-9]+/.test(pool)) {
			//case of dX(kdY)?
			//here, we'll ignore the keep/drop, as only one die.
			const tokens = pool.match(/^d([0-9]+)([kd][0-9]+|$))/);
			//first captured group at index 1.
			const dice_size = parseInt(tokens[1]);
			//then roll it.
			return rollDice(1, dice_size);
		} else if(/^[0-9]+d[0-9]+$/.test(pool)) {
			//no keep/drop, so just XdY
			const tokens = pool.match(/^([0-9]+)d([0-9]+)/);
			//first captured group (number of dice) is index 1.
			const num_dice = parseInt(tokens[1]);
			//second captured group (size of dice) is index 2.
			const dice_size = parseInt(tokens[2]);
			//then roll.
			return rollDice(num_dice, dice_size);
		}

		return 0;
	} else {
		//invalid, return 0.
		return 0;
	}
}

const handle = (msg) => {
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
	reply += "Separated by these operators: [" + operators + "].\n";
	reply += "Got rolls of [" + values + "].";

	if(errors.length > 0) {
		reply += "\nBut, I didn't know what " + (errors.length == 1 ? "this was" : "these were") + " supposed to mean:";
		reply += "\n```\n"
		reply += errors.reduce((acc, val) => acc + "\n" + val);
		reply += "```";
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
