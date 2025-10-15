<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { writable } from 'svelte/store';

	type Option = { value: string; label: string };
	type MultiSelectState = { [key: string]: 0 | 1 | 2 }; // 0: none, 1: included, 2: excluded

	let { options, placeholder, id } = $props<{
		options: Option[];
		placeholder: string;
		id: string;
	}>();

	const multiSelectState = writable<MultiSelectState>({});
	const showPanel = writable(false);
	const searchTerm = writable('');

	const dispatch = createEventDispatcher();

	const filteredOptions = $derived(
		options.filter((opt: Option) => opt.label.toLowerCase().includes($searchTerm.toLowerCase()))
	);
	const triggerText = $derived(() => {
		const includedCount = Object.values($multiSelectState).filter((s) => s === 1).length;
		const excludedCount = Object.values($multiSelectState).filter((s) => s === 2).length;
		if (includedCount === 0 && excludedCount === 0) {
			return placeholder;
		} else {
			return `${includedCount} included, ${excludedCount} excluded`;
		}
	});

	function togglePanel(event: MouseEvent) {
		event.stopPropagation();
		showPanel.update((val) => !val);
	}

	function toggleOption(value: string) {
		multiSelectState.update((s) => {
			const currentState = s[value] || 0;
			const nextState = (currentState + 1) % 3;

			if (nextState === 0) {
				delete s[value];
			} else {
				s[value] = nextState as 0 | 1 | 2;
			}
			return s;
		});
		dispatch('change', $multiSelectState);
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest(`#${id}`)) {
			showPanel.set(false);
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	export function reset() {
		multiSelectState.set({});
		dispatch('change', $multiSelectState);
	}

	export function getState() {
		return $multiSelectState;
	}
</script>

<div class="multiselect-container" {id}>
	<button class="multiselect-trigger" onclick={togglePanel}>{triggerText()}</button>
	{#if $showPanel}
		<div class="multiselect-panel">
			<input
				type="text"
				class="multiselect-search"
				placeholder="Search..."
				bind:value={$searchTerm}
			/>
			<div class="multiselect-options">
				{#each filteredOptions as opt (opt.value)}
					{@const currentState = $multiSelectState[opt.value] || 0}
					<button
						class="multiselect-option"
						class:included={currentState === 1}
						class:excluded={currentState === 2}
						onclick={() => toggleOption(opt.value)}
					>
						<span class="material-symbols-outlined state-icon">
							{#if currentState === 1}check_circle{:else if currentState === 2}cancel{/if}
						</span>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
