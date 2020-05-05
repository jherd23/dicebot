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
	"/r",
	"Roll",
	"!Roll",
	"/Roll",
	"!R",
	"/R"
];

const capture_pools = /[0-9]*(d[0-9]+([dk][0-9]+)?)?/g;
const is_valid_pool_regex = /^[0-9]*(d[0-9]+([dk][0-9]+)?)?$/;
const end_of_pool = /[^0-9dk]/;
const separator = /[ ]/;
const capture_operators = /[\+\-]/g;
const operator = /[\+\-]/;

const checkAgainstAll = (func, arr, and) => {
	return arr.map(func).reduce((acc, val) => and ? acc & val : acc | val);
}

const isCommand = (msg) => {
	const content = msg.content.trim();
	return checkAgainstAll((command) => content.startsWith(command), recognized_commands, false);
}

const rollDice = (num, size, keep) => {
	if(size === 0) return 0;
	var rolls = [];
	for(var i = 0; i < num; i++) {
		rolls.push(parseInt(Math.random() * size + 1));
	}

	//should sort in descending order.
	rolls.sort((a, b) => b - a);
	
	var acc = 0;
	for(var i = 0; i < keep && i < num; i++) {
		acc += rolls[i];
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
			const tokens = pool.match(/^d([0-9]+)([kd][0-9]+|$)/);
			//first captured group at index 1.
			const dice_size = parseInt(tokens[1]);
			//then roll it.
			return rollDice(1, dice_size, 1);
		} else if(/^[0-9]+d[0-9]+$/.test(pool)) {
			//no keep/drop, so just XdY
			const tokens = pool.match(/^([0-9]+)d([0-9]+)$/);
			//first captured group (number of dice) is index 1.
			const num_dice = parseInt(tokens[1]);
			//second captured group (size of dice) is index 2.
			const dice_size = parseInt(tokens[2]);
			//then roll.
			return rollDice(num_dice, dice_size, num_dice);
		} else {
			//must be the full XdYkZ.
			const tokens = pool.match(/^([0-9]+)d([0-9]+)([kd])([0-9]+)$/);
			//first group (numdice) is at [1]
			const num_dice = parseInt(tokens[1]);
			//second group (dice size) is at [2]
			const dice_size = parseInt(tokens[2]);
			//third group determines whether keep or drop, and is at [3]
			const keep = tokens[3] === "k";
			//fourth param is at [4]. number to keep if keep, or num - that if not.
			const num_keep = keep ? parseInt(tokens[4]) : (num_dice - parseInt(tokens[4]));
			if(num_keep < 0) num_keep = 0;
			if(num_keep > num_dice) num_keep = num_dice;
			//rollit  baby!
			return rollDice(num_dice, dice_size, num_keep);
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

	const pool_tokens = content.match(capture_pools).filter((pool) => pool !== "") || [];

	const operators = content.match(capture_operators) || [];

	const errors = pool_tokens.filter((token) => !is_valid_pool_regex.test(token));
	const values = pool_tokens.map((token) => evaluatePool(token));

	var output = "Results: ";
	output += values[0];
	var final_val = values[0];
	for(var i = 1; i < values.length; i++) {
		output += " " + operators[i - 1] + " " + values[i];
		final_val += (operators[i - 1] == "-" ? -1 : 1) * values[i];
	}
	output += " = " + final_val;

	if(errors.length > 0) {
		output += "\nBut, I didn't know what " + (errors.length == 1 ? "this was" : "these were") + " supposed to mean:";
		output += "\n```\n"
		output += errors.reduce((acc, val) => acc + "\n" + val);
		output += "```";
		output += "So, I replaced them with `0`.";
	}

	msg.channel.send(output);
}

bot.on("ready", () => {
	console.log("started up!");
});

bot.on("message", msg => {
	if(isCommand(msg)) {
		handle(msg);
	}
});
