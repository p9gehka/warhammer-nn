import vega from 'vega'
import lite from 'vega-lite'
import TelegramBot from 'node-telegram-bot-api';
import config from './config.json' assert { type: 'json' };
import os from "os";

async function createCanvas(values) {
	const yourVlSpec = { mark: "line", encoding: { x: {field: 'frame', type: 'quantitative'}, y: {field: 'averageReward', type: 'quantitative'} } };
	const vegaspec = lite.compile({ ...yourVlSpec, data: { values } }).spec;
	const view = new vega.View(vega.parse(vegaspec), {renderer: "none"});
	return await view.toCanvas()
}

let bot = null;
export async function sendDataToTelegram(values, message) {
	if (bot === null) {
		bot = new TelegramBot(config.token, {polling: true});
	}
	console.log(`Send value to telegram ${message}`);
	const canvas = await createCanvas(values);
	const data = await canvas.toBuffer();
	await bot.sendMessage(config.chart_id, message + ':' + os.hostname());
	await bot.sendPhoto(config.chart_id, data);
}
