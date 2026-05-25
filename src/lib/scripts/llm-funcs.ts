/* eslint-disable @typescript-eslint/no-unsafe-function-type */

// Please excuse the... Everything that's wrong with this code and how it could be better

export class generationConfiguration {
	providerURL;
	API_KEY;
	modelName;
	modelTemp;
	modelContext;
	responseTokenLimit;
	doStream;

	// modelContext will currently do nothing until I add in either manual token counting or a tokenizer
	constructor(
		providerURL: URL,
		API_KEY: string,
		modelName: string,
		modelTemp: number,
		modelContext: number,
		responseTokenLimit: number,
		doStream: boolean
	) {
		this.providerURL = providerURL;
		this.API_KEY = API_KEY;
		this.modelName = modelName;
		this.modelTemp = modelTemp;
		this.modelContext = modelContext;
		this.responseTokenLimit = responseTokenLimit;
		this.doStream = doStream;
	}
}

/* ------------------------- */

type messageEntry = {
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string;
};

// TODO: Need to add ability to see and store thinking step
export class responseConfiguration {
	messageList;
	systemPrompt;

	// constructor(systemPrompt: string);
	constructor(systemPrompt: string, messageList: messageEntry[]) {
		this.messageList = messageList || [];
		this.systemPrompt = systemPrompt;
	}

	append(msg: messageEntry): void {
		this.messageList.push(msg);
	}

	remove(index: number): void;
	remove(index: number, specialDel?: boolean): void {
		// May want to delete only one message to fuck with llm idk
		if (specialDel == undefined || !specialDel) {
			this.messageList.splice(index);
		} else {
			this.messageList.splice(index, 1);
		}
	}

	edit(index: number, content: string): void {
		this.messageList[index].content = content;
	}
}

/* ------------------------- */

export class generation {
	generationConfiguration;
	responseConfiguration;

	onReceive: Function | undefined; // debug incoming chunks with zero initial processing
	onParse: Function | undefined; // actually useful since this will get called with the returned text
	onError: Function | undefined;
	onFinish: Function | undefined; // post-generation processing may be useful to some

	#signalController: AbortController | undefined;

	constructor(
		generationConfiguration: generationConfiguration,
		responseConfiguration: responseConfiguration
	) {
		this.generationConfiguration = generationConfiguration;
		this.responseConfiguration = responseConfiguration;
	}

	/*
	Store user message to responseConfiguration
	Make request to provider
	Parse incoming chunks
	Call `onReceive` with the chunk as an argument
	Call `onParse` with the parsed chunk's text as an argument
	Parse text from response and add to accumulator
	Call `onFinish` with the fully returned text as an argument
	Store new message to responseConfiguration

	If onReceive or onParse return data, that will replace the data received. If none returned, uses original data.

	Important notes:
	responseConfiguration is NOT updated live! To actually use a stream correctly, you must supply an onReceive or onParse.
	There is no special error handling. If a response fails, it will not retry or anything else.
	If your onReceive or onParse cause an error, it will be fatal and cause the response to be aborted.
	*/

	// TODO: check and disallow for run to be called multiple times during a generation
	async run(message: string): Promise<void> {
		// Vars we need access to incase of an error need to be declared outside of try-catch
		let receivedText = '';
		this.#signalController = new AbortController();

		try {
			// Add user's message
			this.responseConfiguration.append({
				role: 'user',
				content: message
			});

			// Create the body and headers for the fetsh
			const body = this.#assemble_request_body();
			const headers = this.#assemble_headers();

			// Start the actual request
			const response = await fetch(this.generationConfiguration.providerURL, {
				method: 'POST',
				headers: headers,
				body: body,
				signal: this.#signalController.signal
			});

			// Check response status just in case
			if (!response.ok) {
				throw Error(
					'Response error while calling provider! Error: ' +
						response.status +
						', ' +
						response.statusText
				);
			}

			// TODO: Separate handling of non-stream case (much simpler to handle and current parsing would just break)
			// TODO: We could technically count tokens with RLE based on the text streaming for very accurate chat context limits. Wouldn't work for non-streamed responses.

			const responseReader = response.body?.getReader();

			if (responseReader == undefined) {
				throw Error(
					'Somehow, responseReader was undefined so we must destroy everything we worked for!'
				);
			}

			const textDecoder = new TextDecoder();
			// Chunk parsing loop
			while (true) {
				const { done, value } = await responseReader.read();
				if (done) {
					console.log('Response finished. Cleaning up...');
					break;
				}

				// Get received chunks and split by newlines
				let receivedChunk = textDecoder.decode(value, { stream: true });

				// Pass to onReceive if defined
				if (this.onReceive) receivedChunk = this.onReceive(receivedChunk);

				const separatedChunks = receivedChunk.split('\n');

				separatedChunks.forEach((chunk) => {
					receivedText += this.#parse_chunk(chunk);
				});
			}
		} catch (err) {
			if (err != 'early-cancel') {
				this.#signalController.abort();

				if (this.onError) this.onError(err);

				console.error('Error while calling provider! Error shown below: ', err);
			}
		} finally {
			// Final call and saving of response
			this.responseConfiguration.append({
				role: 'assistant',
				content: receivedText
			});

			if (this.onFinish) receivedText = this.onFinish(receivedText) || receivedText;
		}

		console.log('Generation finished.');
	}

	stop() {
		console.log('Response stopped manually. Cleaning up...');
		this.#signalController?.abort('early-cancel');
	}

	#parse_chunk(chunk: string): string {
		// Remove excess whitespace that may remain
		chunk = chunk.trim();

		// Chunk may be the very last chunk possible, check for that
		if (chunk && chunk != 'data: [DONE]') {
			const data = JSON.parse(chunk.slice(5));

			// Check if no text was generated, if this is a stop chunk, or if content is empty before appending
			// UNPLANNED: Support for taking in multiple responses at once
			if (data.choices && data.choices.length != 0 && data.choices[0].delta.content) {
				// Pass to onParse if defined
				if (this.onParse)
					data.choices[0].delta.content =
						this.onParse(data.choices[0].delta.content) || data.choices[0].delta.content;

				return data.choices[0].delta.content;
			} else if (data.error) {
				console.error(
					'Encountered a provider error (' +
						data.error.type +
						')! Message attached: "' +
						data.error.message +
						'"',
					data.error
				);
			}
		}

		// Probably should always return *something*
		return '';
	}

	#assemble_request_body(): string {
		// technically not good because messageEntry could be updated later and this this could no longer work
		// Also add system prompt
		const messageLog: messageEntry[] = [
			{
				role: 'system',
				content: this.responseConfiguration.systemPrompt
			}
		];

		// Assemble messages
		this.responseConfiguration.messageList.forEach((entry) => {
			// just in case messageEntry is modified in the future to contain more data, we don't want extras getting added
			messageLog.push({
				role: entry.role,
				content: entry.content
			});
		});

		return JSON.stringify({
			model: this.generationConfiguration.modelName,
			temperature: this.generationConfiguration.modelTemp,
			max_tokens: this.generationConfiguration.responseTokenLimit,
			stream: this.generationConfiguration.doStream,

			messages: messageLog
		});
	}

	#assemble_headers(): HeadersInit {
		return {
			Authorization: 'Bearer ' + this.generationConfiguration.API_KEY,
			'Content-Type': 'application/json'
		};
	}
}
