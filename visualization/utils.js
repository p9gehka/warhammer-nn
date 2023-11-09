import vega from 'vega'
import lite from 'vega-lite'
import TelegramBot from 'node-telegram-bot-api';
import config from './.config.json' assert { type: 'json' };


async function createCanvas(values) {
	const yourVlSpec = { mark: "line", encoding: { x: {field: 'a', type: 'quantitative'}, y: {field: 'b', type: 'quantitative'} } };
	const vegaspec = lite.compile({ ...yourVlSpec, data: { values: values.map((b, a) => ({ a, b }))} }).spec
	const view = new vega.View(vega.parse(vegaspec), {renderer: "none"});
	return await view.toCanvas()
}


export async function sendDataToTelegram(values) {
	if (bot === null) {
		bot  = new TelegramBot(config.token, {polling: true});
	}
	const canvas = await createCanvas(values);
	const data =  await canvas.toBuffer();
	bot.sendPhoto(config.chart_id,  data);
}