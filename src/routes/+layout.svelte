<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';

	let { children } = $props();

	function navigateToHome() {
		goto(resolveRoute('/'));
	}

	function navigateToSearch() {
		goto(resolveRoute('/search'));
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="top-bar">
	<button class="h1-button" onclick={navigateToHome}>MangaBaka</button>
	<div class="top-bar-actions">
		<button class="icon-btn" title="Search" onclick={navigateToSearch}>
			<span class="material-symbols-outlined">search</span>
		</button>
		<ThemeToggle />
	</div>
</header>

<div class="main-container">
	{@render children?.()}
</div>

<style>
	.h1-button {
		background: none;
		border: none;
		font-size: 1.5em;
		margin: 0;
		color: var(--primary-color);
		cursor: pointer;
		padding: 0;
	}

	.h1-button:hover {
		text-decoration: underline;
	}
</style>