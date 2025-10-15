<script lang="ts">
	import { fetchApi } from '$lib/api';
	import type { PageData } from './$types';
	import MultiSelect from '$lib/components/MultiSelect.svelte';
	import DualRangeSlider from '$lib/components/DualRangeSlider.svelte';
	import SearchResultItem from '$lib/components/SearchResultItem.svelte';
	import { onMount } from 'svelte';
	import type { ApiResponse, Series } from '$lib/types';

	let { data } = $props<{ data: PageData }>();
	let genres = data.genres;

	let advSearchQuery = $state('');
	let advSearchPublisher = $state('');
	let advSearchYearFrom = $state('');
	let advSearchYearTo = $state('');
	let advSearchLicensed = $state<'' | 'true' | 'false'>('');
	let advSearchRatingFrom = $state(0);
	let advSearchRatingTo = $state(10);
	let advSearchSort = $state('relevance');
	let advSearchSortDirection = $state<'asc' | 'desc'>('desc');
	let searchViewMode = $state<'list' | 'grid'>('list');

	let advSearchIsLoading = $state(false);
	let searchResults = $state<Series[]>([]);
	let searchResultCount = $state(0);

	let typeMultiSelect: MultiSelect;
	let statusMultiSelect: MultiSelect;
	let genreMultiSelect: MultiSelect;
	let ratingSlider: DualRangeSlider;

	const typeOptions = [
		{ value: 'manga', label: 'Manga' },
		{ value: 'novel', label: 'Novel' },
		{ value: 'manhwa', label: 'Manhwa' },
		{ value: 'manhua', label: 'Manhua' },
		{ value: 'oel', label: 'OEL' },
		{ value: 'other', label: 'Other' }
	];

	const statusOptions = [
		{ value: 'releasing', label: 'Releasing' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'hiatus', label: 'Hiatus' },
		{ value: 'cancelled', label: 'Cancelled' },
		{ value: 'upcoming', label: 'Upcoming' }
	];

	async function triggerAdvancedSearch(page: number = 1) {
		if (advSearchIsLoading) return;
		advSearchIsLoading = true;

		const buildArrayParams = (key: string, arr: string[]) =>
			arr.map((val) => `&${key}=${encodeURIComponent(val)}`).join('');
		const included = (state: { [key: string]: number }) =>
			Object.entries(state)
				.filter(([, s]) => s === 1)
				.map(([k]) => k);
		const excluded = (state: { [key: string]: number }) =>
			Object.entries(state)
				.filter(([, s]) => s === 2)
				.map(([k]) => k);

		let url = `/series/search?page=${page}&limit=15`;
		const filters = {
			q: advSearchQuery,
			publisher: advSearchPublisher,
			year_lower: advSearchYearFrom,
			year_upper: advSearchYearTo,
			is_licensed: advSearchLicensed,
			rating_lower: advSearchRatingFrom,
			rating_upper: advSearchRatingTo,
			sort_by: `${advSearchSort}_${advSearchSortDirection}`
		};

		for (const [key, value] of Object.entries(filters)) {
			if (value) url += `&${key}=${encodeURIComponent(value)}`;
		}

		url += buildArrayParams('type', included(typeMultiSelect.getState()));
		url += buildArrayParams('type_not', excluded(typeMultiSelect.getState()));
		url += buildArrayParams('status', included(statusMultiSelect.getState()));
		url += buildArrayParams('status_not', excluded(statusMultiSelect.getState()));
		url += buildArrayParams('genre', included(genreMultiSelect.getState()));
		url += buildArrayParams('genre_not', excluded(genreMultiSelect.getState()));

		if (page === 1) {
			searchResults = [];
		}

		try {
			const response = await fetchApi<ApiResponse<Series[]>>(url);
			searchResults = [...searchResults, ...response.data];
			searchResultCount = response.pagination.count;
			// advSearchHasMore = response.pagination.next !== null; // Removed unused variable
			// advSearchPage = page + 1; // Removed unused variable
		} catch (error) {
			console.error(error);
			searchResults = [];
			searchResultCount = 0;
		} finally {
			advSearchIsLoading = false;
		}
	}

	function handleRatingChange(event: CustomEvent) {
		advSearchRatingFrom = event.detail.from;
		advSearchRatingTo = event.detail.to;
	}

	function handleSortDirectionClick(direction: 'asc' | 'desc') {
		advSearchSortDirection = direction;
		triggerAdvancedSearch(1);
	}

	function setSearchViewMode(mode: 'list' | 'grid') {
		searchViewMode = mode;
	}

	onMount(() => {
		// Initial search or load if needed
	});

	function resetSearchView() {
		advSearchQuery = '';
		advSearchPublisher = '';
		advSearchYearFrom = '';
		advSearchYearTo = '';
		advSearchLicensed = '';
		advSearchSort = 'relevance';
		advSearchSortDirection = 'desc';
		searchViewMode = 'list';

		typeMultiSelect.reset();
		statusMultiSelect.reset();
		genreMultiSelect.reset();
		ratingSlider.reset();

		searchResults = [];
		searchResultCount = 0;
		// advSearchPage = 1; // Removed unused variable
		// advSearchHasMore = true; // Removed unused variable
	}
</script>

<div id="search-filters">
	<div class="filter-group" style="grid-column: 1 / -1;">
		<label for="adv-search-query">Title</label>
		<input type="text" id="adv-search-query" placeholder="Title" bind:value={advSearchQuery} />
	</div>
	<div class="filter-group">
		<label for="adv-search-type">Media</label>
		<MultiSelect
			bind:this={typeMultiSelect}
			id="adv-search-type"
			options={typeOptions}
			placeholder="Select Media"
		/>
	</div>
	<div class="filter-group">
		<label for="adv-search-status">Status</label>
		<MultiSelect
			bind:this={statusMultiSelect}
			id="adv-search-status"
			options={statusOptions}
			placeholder="Select Status"
		/>
	</div>
	<div class="filter-group">
		<label for="adv-search-genre">Genre</label>
		<MultiSelect
			bind:this={genreMultiSelect}
			id="adv-search-genre"
			options={genres}
			placeholder="Select Genres"
		/>
	</div>
	<div class="filter-group">
		<label for="adv-search-publisher">Publisher</label>
		<input
			type="text"
			id="adv-search-publisher"
			placeholder="VIZ Media"
			bind:value={advSearchPublisher}
		/>
	</div>
	<div class="filter-group">
		<label for="adv-search-year-from">Year</label>
		<div class="range-group">
			<input
				type="number"
				id="adv-search-year-from"
				placeholder="From"
				bind:value={advSearchYearFrom}
			/>
			<input type="number" id="adv-search-year-to" placeholder="To" bind:value={advSearchYearTo} />
		</div>
	</div>
	<div class="filter-group">
		<label for="adv-search-licensed">Licensed?</label>
		<select id="adv-search-licensed" bind:value={advSearchLicensed}>
			<option value="">Any</option>
			<option value="true">Yes</option>
			<option value="false">No</option>
		</select>
	</div>
	<div class="filter-group" style="grid-column: 1 / -1;">
		<label>Average Rating: <output>{advSearchRatingFrom} - {advSearchRatingTo}</output></label>
		<DualRangeSlider
			bind:this={ratingSlider}
			on:change={handleRatingChange}
			initialFrom={advSearchRatingFrom}
			initialTo={advSearchRatingTo}
		/>
	</div>
	<button id="adv-search-btn" onclick={() => triggerAdvancedSearch(1)}>Search</button>
	<button onclick={resetSearchView}>Reset Filters</button>
</div>
<div id="search-results-header">
	<span id="search-result-count">{searchResultCount} results</span>
	<div style="display: flex; gap: 10px; align-items: center;">
		<select
			id="adv-search-sort"
			bind:value={advSearchSort}
			onchange={() => triggerAdvancedSearch(1)}
		>
			<option value="relevance">Relevance</option>
			<option value="name">Title</option>
			<option value="score">Score</option>
			<option value="popularity">Popularity</option>
			<option value="published_year">Year</option>
		</select>
		<div id="search-sort-direction" class="toggle-switch">
			<button
				class={advSearchSortDirection === 'desc' ? 'active' : ''}
				onclick={() => handleSortDirectionClick('desc')}
				title="Descending"
			>
				<span class="material-symbols-outlined">arrow_downward</span>
			</button>
			<button
				class={advSearchSortDirection === 'asc' ? 'active' : ''}
				onclick={() => handleSortDirectionClick('asc')}
				title="Ascending"
			>
				<span class="material-symbols-outlined">arrow_upward</span>
			</button>
		</div>
		<div id="search-view-mode" class="toggle-switch">
			<button
				class={searchViewMode === 'list' ? 'active' : ''}
				onclick={() => setSearchViewMode('list')}
				title="List View"
			>
				<span class="material-symbols-outlined">view_list</span>
			</button>
			<button
				class={searchViewMode === 'grid' ? 'active' : ''}
				onclick={() => setSearchViewMode('grid')}
				title="Grid View"
			>
				<span class="material-symbols-outlined">grid_view</span>
			</button>
		</div>
	</div>
</div>
<ul id="search-results-list" class={searchViewMode === 'grid' ? 'grid-view' : 'list-view'}>
	{#each searchResults as series (series.id)}
		<SearchResultItem {series} viewMode={searchViewMode} />
	{:else}
		{#if !advSearchIsLoading && searchResults.length === 0}
			<li style="background: none; box-shadow: none; padding: 20px; text-align: center;">
				No search results.
			</li>
		{/if}
	{/each}
</ul>

{#if advSearchIsLoading}
	<div style="text-align: center; padding: 20px;">Loading more...</div>
{/if}
