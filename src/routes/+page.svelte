<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchApi } from '$lib/api';
	import { favoritesStore } from '$lib/stores/favoritesStore';
	// import { goto } from '$app/navigation'; // Removed unused import
	import FavoriteItem from '$lib/components/FavoriteItem.svelte';
	import type { ApiResponse, Favorite, Series } from '$lib/types';

	let currentPage = $state(1);
	let isLoading = $state(false);
	let hasMore = $state(true);
	let currentFilters = $state({
		search: '',
		status: '',
		sortField: 'default',
		sortDirection: 'desc'
	});
	let viewMode = $state<'list' | 'grid'>('list');

	async function fetchFavorites(page: number = 1) {
		if (isLoading || (page > 1 && !hasMore)) return;
		isLoading = true;

		let url = `/my/favorites?page=${page}&limit=24`;
		if (currentFilters.search) url += `&q=${encodeURIComponent(currentFilters.search)}`;
		if (currentFilters.status) url += `&state=${currentFilters.status}`;

		if (currentFilters.sortField !== 'default') {
			url += `&sort_by=${currentFilters.sortField}_${currentFilters.sortDirection}`;
		} else {
			url += `&sort_by=default`;
		}

		try {
			const response = await fetchApi<ApiResponse<Favorite[]>>(url);
			if (page === 1) {
				favoritesStore.set(new Map());
			}
			response.data.forEach((fav: Favorite) =>
				favoritesStore.addFavorite({ ...fav, Series: fav.Series as Series })
			);
			hasMore = response.pagination.next !== null;
			currentPage = page + 1;
		} catch (error) {
			console.error('Error fetching favorites:', error);
			// Handle error display in UI
		} finally {
			isLoading = false;
		}
	}

	function handleScroll() {
		if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
			fetchFavorites(currentPage);
		}
	}

	let searchTimeout: ReturnType<typeof setTimeout>;
	function resetAndFetch() {
		currentPage = 1;
		hasMore = true;
		window.scrollTo(0, 0);
		fetchFavorites(1);
	}

	function handleSearchInput(event: Event) {
		clearTimeout(searchTimeout);
		currentFilters.search = (event.target as HTMLInputElement).value;
		searchTimeout = setTimeout(resetAndFetch, 300);
	}

	function handleStatusChange(event: Event) {
		currentFilters.status = (event.target as HTMLSelectElement).value;
		resetAndFetch();
	}

	function handleSortFieldChange(event: Event) {
		currentFilters.sortField = (event.target as HTMLSelectElement).value;
		resetAndFetch();
	}

	function handleSortDirectionClick(direction: 'asc' | 'desc') {
		currentFilters.sortDirection = direction;
		resetAndFetch();
	}

	function setViewMode(mode: 'list' | 'grid') {
		viewMode = mode;
	}

	onMount(() => {
		fetchFavorites();
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	// function openDetailView(seriesId: number) {
	//     goto(`/manga/${seriesId}`);
	// }
</script>

<div class="action-bar">
	<select id="filter-status" onchange={handleStatusChange}>
		<option value="">Filter by Status</option>
		<option value="reading">Reading</option>
		<option value="completed">Completed</option>
		<option value="paused">On Hold</option>
		<option value="dropped">Dropped</option>
		<option value="plan_to_read">Plan to Read</option>
	</select>
	<select id="sort-field" onchange={handleSortFieldChange}>
		<option value="default">Sort by Default</option>
		<option value="series_title">Title</option>
		<option value="updated_at">Last Read</option>
		<option value="created_at">Last Added</option>
		<option value="my_rating">My Rating</option>
		<option value="series_rating">Global Rating</option>
	</select>
	<div
		id="dashboard-sort-direction"
		class="toggle-switch"
		style="display: {currentFilters.sortField === 'default' ? 'none' : 'flex'};"
	>
		<button
			class={currentFilters.sortDirection === 'desc' ? 'active' : ''}
			onclick={() => handleSortDirectionClick('desc')}
			title="Descending"
		>
			<span class="material-symbols-outlined">arrow_downward</span>
		</button>
		<button
			class={currentFilters.sortDirection === 'asc' ? 'active' : ''}
			onclick={() => handleSortDirectionClick('asc')}
			title="Ascending"
		>
			<span class="material-symbols-outlined">arrow_upward</span>
		</button>
	</div>
	<input
		type="text"
		id="search-bar"
		class="search-bar"
		placeholder="Search my list..."
		oninput={handleSearchInput}
	/>
	<div class="toggle-switch">
		<button
			class={viewMode === 'list' ? 'active' : ''}
			onclick={() => setViewMode('list')}
			title="List View"
		>
			<span class="material-symbols-outlined">view_list</span>
		</button>
		<button
			class={viewMode === 'grid' ? 'active' : ''}
			onclick={() => setViewMode('grid')}
			title="Grid View"
		>
			<span class="material-symbols-outlined">grid_view</span>
		</button>
	</div>
</div>

<ul id="favorites-list" class={viewMode === 'grid' ? 'grid-view' : 'list-view'}>
	{#each $favoritesStore as [seriesId, fav] (seriesId)}
		<FavoriteItem {fav} {viewMode} />
	{:else}
		{#if !isLoading}
			<li style="background: none; box-shadow: none; padding: 20px; text-align: center;">
				No favorites found.
			</li>
		{/if}
	{/each}
</ul>

{#if isLoading}
	<div style="text-align: center; padding: 20px;">Loading more...</div>
{/if}
