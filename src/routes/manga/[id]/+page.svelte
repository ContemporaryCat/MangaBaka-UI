<script lang="ts">
	import { goto } from '$app/navigation';
	import { fetchApi, updateFavoriteApi, addToFavoritesApi, getSourceUrl } from '$lib/api';
	import { favoritesStore } from '$lib/stores/favoritesStore';
	import type { PageData } from './$types';
	import type { Series, Favorite, ApiResponse, RelatedSeries } from '$lib/types';

	let { data } = $props<{ data: PageData }>();

	let series: Series = data.series;
	let favorite = $state<Favorite | undefined>(data.favorite);
	let seriesId: number = data.seriesId;

	let showRelatedSeries = $state(false);
	let relatedSeriesData = $state<RelatedSeries[]>([]);
	let loadingRelated = $state(false);

	const isFavorite = $derived(!!favorite);

	const altTitles = $derived(
		Object.values(series.secondary_titles || {})
			.flat()
			.map((t: { title: string }) => t.title)
			.join(', ')
	);
	const statusIcons: { [key: string]: string } = {
		releasing: 'play_circle',
		completed: 'check_circle',
		hiatus: 'pause_circle',
		cancelled: 'cancel',
		upcoming: 'update',
		unknown: 'help'
	};

	async function handleAddToFavorites() {
		try {
			const newFavData = await addToFavoritesApi(seriesId);
			const seriesResponse = await fetchApi<ApiResponse<Series>>(`/series/${seriesId}`);
			const newFav: Favorite = { ...newFavData, Series: seriesResponse.data };
			favoritesStore.addFavorite(newFav);
			favorite = newFav;
			alert('Added to favorites!');
		} catch (error) {
			console.error('Add to favorites error:', error);
			alert('Could not add to favorites.');
		}
	}

	async function handleEditFormSubmit(event: Event) {
		event.preventDefault();
		if (!favorite) return;

		const form = event.target as HTMLFormElement;
		const state = (form.elements.namedItem('edit-status') as HTMLSelectElement)
			.value as Favorite['state'];
		const progress_chapter =
			parseInt((form.elements.namedItem('edit-chapter') as HTMLSelectElement).value) || null;
		const progress_volume =
			parseInt((form.elements.namedItem('edit-volume') as HTMLSelectElement).value) || null;
		const ratingInput = form.elements.namedItem('edit-rating') as HTMLInputElement;
		const rating = ratingInput ? parseFloat(ratingInput.value) : null;

		const payload: Partial<Favorite> = {
			state,
			rating,
			progress_chapter,
			progress_volume
		};

		try {
			const updatedFav = await updateFavoriteApi(seriesId, payload);
			favoritesStore.updateFavorite(seriesId, updatedFav);
			favorite = favoritesStore.getFavorite(seriesId);
			alert('Favorite updated successfully!');
		} catch (error) {
			console.error('Update error:', error);
			alert(`Could not update favorite: ${(error as Error).message}`);
		}
	}

	async function loadRelatedSeries() {
		if (!series.relationships || loadingRelated) return;
		loadingRelated = true;

		const relationPromises = Object.entries(series.relationships)
			.filter(([, ids]) => ids && (ids as number[]).length > 0)
			.flatMap(([type, ids]) =>
				(ids as number[]).map((id) =>
					fetchApi<ApiResponse<Series>>(`/series/${id}`).then((res) => ({
						...res.data,
						relationType: type
					}))
				)
			);

		try {
			relatedSeriesData = await Promise.all(relationPromises);
			showRelatedSeries = true;
		} catch (error) {
			console.error('Failed to load related series:', error);
		} finally {
			loadingRelated = false;
		}
	}

	function openRelatedSeriesDetail(relatedSeriesId: number) {
		// With the rule disabled, you can use your original goto call
		goto(`/manga/${relatedSeriesId}`);
	}

	// Using writable derived is still recommended
	let myRating = $derived.by(() => {
		return favorite?.rating ?? null;
	});

	function handleRatingChange(event: Event) {
		myRating = parseFloat((event.target as HTMLInputElement).value);
	}

	function removeRating() {
		myRating = null;
	}

	function addRating() {
		myRating = 5;
	}

	// Chapter and Volume select options
	let chapterOptions = $state<number[]>([]);
	let volumeOptions = $state<number[]>([]);

	$effect(() => {
		if (favorite) {
			const totalChapters =
				favorite.Series.total_chapters !== undefined
					? parseInt(String(favorite.Series.total_chapters))
					: 100;
			const totalVolumes =
				favorite.Series.final_volume !== undefined
					? parseInt(String(favorite.Series.final_volume))
					: 20;
			chapterOptions = Array.from({ length: totalChapters + 1 }, (_, i) => i);
			volumeOptions = Array.from({ length: totalVolumes + 1 }, (_, i) => i);
		}
	});
</script>

<div class="detail-header">
	<button class="back-button" onclick={() => history.back()}
		><span class="material-symbols-outlined">arrow_back</span> Back</button
	>
	<h1>{series.title}</h1>
	{#if altTitles}
		<p class="alt-titles">{altTitles}</p>
	{/if}
</div>
<div class="detail-grid">
	<aside class="detail-sidebar">
		<div class="detail-card">
			<img src={series.cover.x350.x1} alt={series.title} class="cover" />
			{#if isFavorite}
				<div class="detail-section">
					<h4>My Progress</h4>
					<form id="edit-form" onsubmit={handleEditFormSubmit}>
						<div class="edit-form-grid">
							<div class="form-group full-width">
								<label for="edit-status">Status</label>
								<select id="edit-status" name="edit-status">
									<option value="reading" selected={favorite?.state === 'reading'}>Reading</option>
									<option value="completed" selected={favorite?.state === 'completed'}
										>Completed</option
									>
									<option value="paused" selected={favorite?.state === 'paused'}>On Hold</option>
									<option value="dropped" selected={favorite?.state === 'dropped'}>Dropped</option>
									<option value="plan_to_read" selected={favorite?.state === 'plan_to_read'}
										>Plan to Read</option
									>
								</select>
							</div>
							<div class="form-group">
								<label for="edit-chapter">Chapter</label>
								<select id="edit-chapter" name="edit-chapter">
									{#each chapterOptions as chapter (chapter)}
										<option value={chapter} selected={chapter === favorite?.progress_chapter}
											>{chapter}</option
										>
									{/each}
								</select>
							</div>
							<div class="form-group">
								<label for="edit-volume">Volume</label>
								<select id="edit-volume" name="edit-volume">
									{#each volumeOptions as volume (volume)}
										<option value={volume} selected={volume === favorite?.progress_volume}
											>{volume}</option
										>
									{/each}
								</select>
							</div>
							<div class="form-group full-width">
								<label for="edit-rating">My Rating</label>
								{#if myRating !== null}
									<div class="rating-group">
										<input
											type="range"
											id="edit-rating"
											name="edit-rating"
											min="0"
											max="10"
											step="0.5"
											value={myRating}
											oninput={handleRatingChange}
										/>
										<output for="edit-rating">{myRating}</output>
										<button
											type="button"
											onclick={removeRating}
											class="save-button"
											style="margin-top: 0; padding: 5px 10px;">Remove</button
										>
									</div>
								{:else}
									<button
										type="button"
										onclick={addRating}
										class="save-button"
										style="margin-top: 0;">Add Rating</button
									>
								{/if}
							</div>
						</div>
						<button type="submit" class="save-button">Save Changes</button>
					</form>
				</div>
			{:else}
				<div class="detail-section">
					<button class="save-button" onclick={handleAddToFavorites}>Add to Favorites</button>
				</div>
			{/if}
		</div>
	</aside>
	<main class="detail-main">
		<div class="detail-card">
			<div class="detail-section">
				<h4>Synopsis</h4>
				<p>{series.description || 'No synopsis available.'}</p>
			</div>
			<div class="detail-section">
				<h4>Details</h4>
				<div class="tags-list">
					<span class="badge genre"
						><span class="material-symbols-outlined">book</span> {series.type || 'N/A'}</span
					>
					<span class="badge genre"
						><span class="material-symbols-outlined">{statusIcons[series.status] || 'help'}</span
						> {series.status || 'N/A'}</span
					>
					<span class="badge genre"
						><span class="material-symbols-outlined">calendar_month</span> {series.year ||
							'N/A'}</span
					>
					<span class="badge genre"
						><span class="material-symbols-outlined">shield</span> {series.content_rating ||
							'N/A'}</span
					>
					<span class="badge genre"
						><span class="material-symbols-outlined">verified</span>
						{series.is_licensed ? 'Licensed' : 'Not Licensed'}</span
					>
				</div>
			</div>
			<div class="detail-section">
				<h4>Staff & Publishers</h4>
				<div class="metadata-list">
					<p><strong>Authors:</strong> <span class="value">{series.authors?.join(', ') || 'N/A'}</span></p>
					<p><strong>Artists:</strong> <span class="value">{series.artists?.join(', ') || 'N/A'}</span></p>
					{#if series.anime?.start}
						<p><strong>Anime Start:</strong> <span class="value">{series.anime.start}</span></p>
					{/if}
					{#if series.anime?.end}
						<p><strong>Anime End:</strong> <span class="value">{series.anime.end}</span></p>
					{/if}
					{#each series.publishers || [] as p (p.name)}
						<p>
							<strong>{p.type}:</strong>
							<span class="value">{p.name} {#if p.note}({p.note}){/if}</span>
						</p>
					{/each}
				</div>
			</div>
			<div class="detail-section">
				<h4>Ratings</h4>
				<div class="ratings-list">
					{#each Object.entries(series.source || {}) as [key, value] (key)}
						{#if value && value.id}
							{@const siteUrl = getSourceUrl(key, value.id)}
							{#if siteUrl.startsWith('http')}
								{@const siteName = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
								{@const domain = new URL(siteUrl).hostname}
								<a href={siteUrl} target="_blank" rel="noopener noreferrer" class="rating-link">
									<img
										src={`https://www.google.com/s2/favicons?domain=${domain}`}
										alt={`${siteName} icon`}
									/>
									{siteName}: {value.rating ? value.rating.toFixed(1) : 'N/A'}
								</a>
							{/if}
						{/if}
					{/each}
				</div>
			</div>
			<div class="detail-section">
				<h4>Links</h4>
				<div class="links-list">
					{#each series.links || [] as link (link)}
						{@const validUrl = link.startsWith('http') ? link : 'https://' + link}
						{@const url = new URL(validUrl)}
						{@const hostname = url.hostname.replace('www.', '')}
						<a href={validUrl} target="_blank" rel="noopener noreferrer" class="external-link">
							<img
								src={`https://www.google.com/s2/favicons?domain=${hostname}`}
								alt={`${hostname} icon`}
							/>
							{hostname}
						</a>
					{/each}
				</div>
			</div>
			<div class="detail-section">
				<h4>Genres</h4>
				<div class="tags-list">
					{#each series.genres || [] as g (g)}
						<span class="badge genre">{g}</span>
					{/each}
				</div>
			</div>
			<div class="detail-section">
				<h4>Tags</h4>
				<div class="tags-list">
					{#each series.tags || [] as t (t)}
						<span class="badge">{t}</span>
					{/each}
				</div>
			</div>
			{#if series.relationships}
				<div class="detail-section">
					<h4>Related Series</h4>
					{#if !showRelatedSeries}
						<button onclick={loadRelatedSeries} class="save-button" disabled={loadingRelated}>
							{#if loadingRelated}Loading...{:else}Load Related Series{/if}
						</button>
					{/if}
					{#if showRelatedSeries}
						<div id="related-series-container">
							{#each relatedSeriesData as relatedSeries (relatedSeries.id)}
								<button
									class="related-series-card"
									onclick={() => openRelatedSeriesDetail(relatedSeries.id)}
								>
									<h5>{relatedSeries.title}</h5>
									<p><strong>Relation:</strong> {relatedSeries.relationType.replace(/_/g, ' ')}</p>
									<p><strong>Type:</strong> {relatedSeries.type}</p>
									<p><strong>Status:</strong> {relatedSeries.status}</p>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</main>
</div>