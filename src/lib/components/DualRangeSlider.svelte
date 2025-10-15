<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let {
		min = 0,
		max = 10,
		step = 0.5,
		initialFrom = 0,
		initialTo = 10
	} = $props<{
		min?: number;
		max?: number;
		step?: number;
		initialFrom?: number;
		initialTo?: number;
	}>();

	let fromValue = $state(initialFrom);
	let toValue = $state(initialTo);

	const dispatch = createEventDispatcher();

	function controlFromSlider() {
		if (fromValue >= toValue) {
			fromValue = toValue;
		}
		dispatchValues();
	}

	function controlToSlider() {
		if (toValue <= fromValue) {
			toValue = fromValue;
		}
		dispatchValues();
	}

	function dispatchValues() {
		dispatch('change', { from: fromValue, to: toValue });
	}

	const fromPercent = $derived(fromValue / max);
	const rangePercent = $derived((toValue - fromValue) / max);
	const thumbWidthPx = 20; // Corresponds to the thumb width in CSS

	const sliderFillStyle = $derived(
		`left: calc(${fromPercent * 100}% + ${thumbWidthPx * (0.5 - fromPercent)}px); width: calc(${rangePercent * 100}% - ${thumbWidthPx * rangePercent}px);`
	);

	export function reset() {
		fromValue = initialFrom;
		toValue = initialTo;
		dispatchValues();
	}

	export function getValues() {
		return { from: fromValue, to: toValue };
	}
</script>

<div class="dual-range-slider">
	<div class="slider-track"></div>
	<div class="slider-fill" style={sliderFillStyle}></div>
	<input type="range" bind:value={fromValue} {min} {max} {step} oninput={controlFromSlider} />
	<input type="range" bind:value={toValue} {min} {max} {step} oninput={controlToSlider} />
</div>
