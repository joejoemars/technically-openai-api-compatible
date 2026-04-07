<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<div id="container">
	<p>welcome to the error page!</p>
	<p>below is the supposed error</p>

	<br />
	<br />

	<p>error code: <code>{page.status}</code></p>
	<p>error message: <code>{page.error?.message || 'somehow, there is no message'}</code></p>

	<br /><br />

	<p>
		do not make an issue on the repo for this unless you yourself know what went wrong because i
		will likely never figure it out
	</p>
	<a href={resolve('/')}>home</a>
</div>

<style>
	:root {
		font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
	}

	* {
		display: block;
		box-sizing: border-box;
	}

	code {
		width: max-content;
		display: inline;
		background-color: #0001;
	}

	br {
		margin-bottom: 1rem;
	}

	p {
		margin-bottom: 0;
		margin-top: 0.5rem;
	}

	#container {
		width: 60vw;
		padding-top: 1em;
	}
</style>
