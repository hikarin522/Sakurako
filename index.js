var Botkit = require('botkit');
var DocomoAPI = require('docomo-api');
var key = require('./key.json');

var api = new DocomoAPI(key.docomo);
api.context = {};
api.mode = {};

var controller = Botkit.slackbot({debug: false});
controller.spawn({token: key.slack}).startRTM();

controller.hears('', ['direct_message', 'direct_mention', 'mention', 'ambient'], (bot, msg) => {
	api.createKnowledgeQA(msg.text, (err, res) => {
		if (!err && res.code[0] === 'S' && res.code !== 'S020011' && res.code !== 'S020010') {
			bot.reply(msg, res.message.textForDisplay);
			return;
		}

		bot.api.users.info({'user': msg.user}, (err, res) => {
			if (err) {
				console.log(err);
				return;
			}

			if (res.user.name === 'slackbot') {
				return;
			}

			api.createDialogue(msg.text, {
				'context': api.context[msg.channel] || '',
				'mode': api.mode[msg.channel] || '',
				't': 20,
				'nickname': res.user.name,
			}, (err, data) => {
				if (err) {
					console.log(err);
					return;
				}

				api.context[msg.channel] = data.context;
				api.mode[msg.channel] = data.mode;
				bot.reply(msg, data.utt);
			});
		});
	});
});
