import vega from 'vega';
import lite from 'vega-lite';
import sharp from 'sharp';
import TelegramBot from 'node-telegram-bot-api';
import config from './config.json' assert { type: 'json' };
import os from "os";

const specs = {
	line: (fields) => ({
		mark: "line",
		config: { axis: { grid: true,  gridColor: config.gridColor } },
		encoding: { x: {field: fields[0], type: 'quantitative'}, y: {field: fields[1], type: 'quantitative'} }
	}),
	bar: (fields) => ({
	  "mark": "bar",
	  "encoding": {
	    "x": {"field": fields[0], "type": "nominal" },
	    "y": {"field": fields[1], "type": "quantitative"}
	  }
	})
}


async function createSVG(values, spec) {
	const fields = Object.keys(values[0]);
	const vegaspec = lite.compile({ ...specs[spec](fields), data: { values } }).spec;
	const view = new vega.View(vega.parse(vegaspec), {renderer: "none"});
	return await view.toSVG();
}

let bot = null;
export async function sendDataToTelegram(rewardAverager, message) {
	if (bot === null && config.token.length > 0) {
		bot = new TelegramBot(config.token, {polling: true});
	}
	console.log(`Send value to telegram ${message}`);
	const rewardAveragerSvg = await createSVG(rewardAverager, 'line');
	const rewardAveragerPNG = await sharp(Buffer.from(rewardAveragerSvg)).toFormat('png').toBuffer();

	await bot?.sendMessage(config.chat_id, message + ':' + os.hostname(), { reply_to_message_id: config.reply_to_message_id });
	await bot?.sendPhoto(config.chat_id, rewardAveragerPNG, { reply_to_message_id: config.reply_to_message_id });
}


export async function sendMesage(message) {
	if (bot === null && config.token.length > 0) {
		bot = new TelegramBot(config.token, {polling: true});
	}
	console.log(`Send value to telegram ${message}`);

	await bot?.sendMessage(config.chat_id, message + ':' + os.hostname(), { reply_to_message_id: config.reply_to_message_id });
}

