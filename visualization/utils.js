import vega from 'vega'
import lite from 'vega-lite'
import TelegramBot from 'node-telegram-bot-api';
import config from './config.json' assert { type: 'json' };


async function createCanvas(values) {
	const yourVlSpec = { mark: "line", encoding: { x: {field: 'a', type: 'quantitative'}, y: {field: 'b', type: 'quantitative'} } };
	const vegaspec = lite.compile({ ...yourVlSpec, data: { values: values.map((b, a) => ({ a, b }))} }).spec
	const view = new vega.View(vega.parse(vegaspec), {renderer: "none"});
	return await view.toCanvas()
}

let bot = null;
export async function sendDataToTelegram(values, message) {
	if (bot === null) {
		bot  = new TelegramBot(config.token, {polling: true});
	}
	console.log(`send value to telegram ${message}`);
	const canvas = await createCanvas(values);
	const data =  await canvas.toBuffer();
	bot.sendMessage(config.chart_id, message)
	bot.sendPhoto(config.chart_id, data);
}

export function startBot(cb) {
	if (bot === null) {
		bot  = new TelegramBot(config.token, {polling: true});
	}
	bot.on('message', (msg) => {
		sendDataToTelegram(...cb())
	});
}
/* message*/