<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div>
	{@render children()}
</div>

<style>
	div {
		display: flex;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	:global(body) {
		min-width: 100vw;
		min-height: 100vh;
		margin: 0;
	}
</style>
