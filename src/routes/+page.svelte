<script lang="ts">
	let provider_url: string = $state('');
	let API_KEY: string = $state('');
	let model_name: string = $state('');
	let model_temperature = $state(0.8);
	let stream_output = $state(true);
	let system_prompt = $state('You are a helpful assistant. Speak in short, concise sentences.');
	let user_message = $state(
		'How many kinds of poultry are commonly eaten around the world? What are the names of some of the more popular dishes?'
	);

	let gen_config: generationConfiguration;
	let res_config: responseConfiguration | undefined = $state();
	let generator: generation;

	import {
		generationConfiguration,
		responseConfiguration,
		generation
	} from '$lib/scripts/llm-funcs';
	import { marked } from 'marked';

	function checkConf() {
		if (gen_config == undefined || res_config == undefined || generator == undefined) {
			throw Error('Save configuration first!');
		}
	}

	let generating_message: string = $state('');
	function sendMessage() {
		checkConf();

		generating_message = ' ';

		generator.run(user_message);
	}

	function saveConfiguration() {
		// Validate URL
		let valid_provider_url: URL;

		try {
			valid_provider_url = new URL(provider_url);
		} catch (e) {
			console.error('URL Validation failed! Error attached below:\n', e);
			return;
		}

		gen_config = new generationConfiguration(
			valid_provider_url,
			API_KEY,
			model_name,
			model_temperature,
			-1,
			10000,
			stream_output
		);

		let messages = $state([]);

		res_config = new responseConfiguration(system_prompt, messages);

		generator = new generation(gen_config, res_config);

		generator.onParse = (text: string) => {
			generating_message += text;
		};

		generator.onFinish = () => {
			generating_message = '';
		};
	}

	function deleteMessage(index: number) {
		checkConf();

		// satisfy ts and its stupid ass
		if (res_config) res_config.remove(index);
	}

	function stopGeneration() {
		generator.stop = true;
	}
</script>

<div id="container">
	<h1>"Technically OpenAI API Compatible"</h1>
	<h3>A 'Stupid Simple LLM Chat Interface'</h3>
	<sup>
		basically hand-built too, you technically only need <code>llm-funcs.ts</code>, the rest of the
		code here is the ui. lol. lmao.
		<br />
		nothing goes to my server by the way. well, nothing <em>should</em> be going to it...
		<br />
		also, nothing here is actually saved at all.
	</sup>

	<br />
	<br />

	<form onsubmit={sendMessage}>
		<fieldset id="configuration">
			<legend>Configuration</legend>

			<fieldset>
				<legend>Provider/Model Settings</legend>

				<label for="provider_url">Provider URL</label>
				<input id="provider_irl" type="text" bind:value={provider_url} required />

				<label for="API_KEY">API Key</label>
				<input id="API_KEY" type="text" bind:value={API_KEY} required />

				<label for="model_name">Model Name</label>
				<input id="model_name" type="text" bind:value={model_name} required />

				<label for="model_temperature">Model Temperature</label>
				<input
					id="model_temperature"
					type="number"
					min="0"
					max="2"
					step="0.1"
					bind:value={model_temperature}
					required
				/>

				<br />
				<input id="stream_output" type="checkbox" bind:checked={stream_output} disabled />
				<label for="stream_output">Stream Output?</label>
				<sup class="hint" title="Only streaming is currently implemented."
					><em>why disabled?</em></sup
				>
			</fieldset>

			<fieldset id="content">
				<legend>Content to Use/Send</legend>

				<label for="system_prompt">system prompt:</label>
				<textarea id="system_prompt" rows="5" cols="40" bind:value={system_prompt} required
				></textarea>

				<label for="user_message">user message:</label>
				<textarea id="user_message" rows="5" cols="40" bind:value={user_message} required
				></textarea>
			</fieldset>
			<br />
			<input class="hint" type="button" value="Save Settings" onclick={saveConfiguration} />
			<sup class="hint" title="You dare question my ways? Joking, I've no clue"
				><em>why not auto save?</em></sup
			>
			<br />
			<input type="submit" value="Send Message" />
			<br />
			{#if generating_message != ''}
				<input type="button" value="Stop Generation" onclick={stopGeneration} />
			{/if}
		</fieldset>
	</form>

	<!-- move to own component *later* -->
	{#snippet message(role: string, content: string, index: number)}
		<li>
			<fieldset class="message-container">
				<legend>{role}</legend>
				<fieldset class="message">
					<!-- hush computer i know what im doing. vaguely. -->
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html marked.parse(content, { async: false })}
				</fieldset>
				<br />
				{#if generating_message == ''}
					<input type="button" value="Delete Message" onclick={() => deleteMessage(index)} />
				{/if}
			</fieldset>
		</li>
	{/snippet}
	<ol class="message-list">
		<!-- eslint-disable-next-line svelte/require-each-key -->
		{#each res_config?.messageList as msg, index}
			{@render message(msg.role, msg.content, index)}
		{/each}
		{#if generating_message != ''}
			<!-- <p>STREAMED RESPONSE BELOW:</p> -->
			{@render message('assistant', generating_message, -1)}
		{/if}
	</ol>
</div>

<style>
	:root {
		font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
	}

	* {
		display: block;
		box-sizing: border-box;
	}

	h1,
	h3 {
		margin-bottom: 0;
	}

	h1,
	h3 {
		margin-top: 0;
	}

	em {
		display: inline;
	}

	br {
		margin-bottom: 0.5rem;
	}

	code {
		width: max-content;
		display: inline;
		background-color: #0001;
	}

	input,
	textarea {
		border-radius: 4px;
		border-width: 1px;
	}

	input[type='checkbox'],
	label {
		display: inline;
	}

	fieldset {
		border-radius: 4px;
	}

	ol > li {
		display: list-item;
	}

	#API_KEY {
		-webkit-text-security: disc;
	}

	#container {
		width: clamp(0px, min-content, 40vw);
		max-width: 40vw;
		margin: 1em;
		margin-top: 0.5rem;
	}

	.hint {
		display: inline;
	}

	sup.hint {
		cursor: default;
		text-decoration: underline;
	}

	.message {
		overflow-wrap: anywhere;
	}
</style>
