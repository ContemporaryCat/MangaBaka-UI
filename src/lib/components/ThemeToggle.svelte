<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	type Theme = 'system' | 'light' | 'dark';

	const themes: Theme[] = ['system', 'light', 'dark'];
	const themeIcons = { system: 'desktop_windows', light: 'light_mode', dark: 'dark_mode' };

	const currentTheme = writable<Theme>('system');

	function applyTheme(theme: Theme) {
		const isDark =
			theme === 'dark' ||
			(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		document.documentElement.classList.toggle('dark', isDark);
		currentTheme.set(theme);
	}

	function toggleTheme() {
		const currentIndex = themes.indexOf($currentTheme);
		const nextIndex = (currentIndex + 1) % themes.length;
		const newTheme = themes[nextIndex];
		localStorage.setItem('theme', newTheme);
		applyTheme(newTheme);
	}

	onMount(() => {
		const savedTheme = (localStorage.getItem('theme') as Theme) || 'system';
		applyTheme(savedTheme);

		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
			if (localStorage.getItem('theme') === 'system') {
				applyTheme('system');
			}
		});
	});
</script>

<button
	id="theme-toggle"
	class="icon-btn"
	title="Theme: {$currentTheme.charAt(0).toUpperCase() + $currentTheme.slice(1)}"
	onclick={toggleTheme}
>
	<span class="material-symbols-outlined">{themeIcons[$currentTheme]}</span>
</button>
