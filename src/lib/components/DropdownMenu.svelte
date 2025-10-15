<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';

	let { items } = $props<{ items: { label: string; icon: string; action: string }[] }>();

	const dispatch = createEventDispatcher();

	function selectItem(action: string) {
		dispatch('select', action);
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.dropdown')) {
			dispatch('close');
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside, true);
		return () => {
			document.removeEventListener('click', handleClickOutside, true);
		};
	});
</script>

<div class="dropdown">
	{#each items as item (item.action)}
		<button class="dropdown-item" onclick={() => selectItem(item.action)}>
			<span class="material-symbols-outlined">{item.icon}</span>
			{item.label}
		</button>
	{/each}
</div>
