/* global fetch, TextDecoder */

let index = 0;

class MyTransformer {
	start() {
		this.pending = [];
		this.decoder = new TextDecoder();
	}

	transform(chunk, controller) {
		let result = this.decoder.decode(chunk);

		if (this.pending.length > 0) {
			result = this.pending[0] + result;
			this.pending = [];
		}

		const lines = result.split('\n');
		const characters = result.split('');
		const isEndingIncomplete = characters[characters.length - 1] !== '\n';

		if (isEndingIncomplete) {
			this.pending.push(lines.pop());
		}

		lines.forEach(line => controller.enqueue(line));
	}
}

async function init() {
	const response = await fetch('data/data.csv');
	const myTransformerInstance = new MyTransformer();
	const transformStreamInstance = new TransformStream(myTransformerInstance);
	const stream = response.body.pipeThrough(transformStreamInstance);
	const reader = stream.getReader();

	const allResults = [];

	while (true) {
		const {value, done} = await reader.read();
		allResults.push(value);
		if (done) break;
	}

	if (verifyResults(allResults)) {
		console.log('✅️ It worked!')
	} else {
		console.error('❌️ Unexpected results')
	}
}

function verifyResults(results) {
	const amount = 9999;
	let i = 0;

	for (; i < amount; i++) {
		const actualResult = results[i];
		const expectedResult = `${i},hello world`;
		const matches = actualResult === expectedResult;
		console.assert(matches, `Got: '${actualResult}' but needed '${expectedResult}'`);

		if (!matches) {
			console.info(`Before: ${results[i - 1]}`);
			console.info(`Current: ${actualResult}`);
			console.info(`After: ${results[i + 1]}`);
			break;
		}
	}

	return i === amount;
}

init();
