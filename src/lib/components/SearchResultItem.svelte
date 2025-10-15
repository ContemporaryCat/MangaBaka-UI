<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolveRoute } from '$app/paths';
    import { getSourceUrl } from '$lib/api';
    import type { Series } from '$lib/types';

    let { series, viewMode } = $props<{ series: Series, viewMode: 'list' | 'grid' }>();

    const statusIcons: { [key: string]: string } = {
        releasing: 'play_circle', completed: 'check_circle', hiatus: 'pause_circle',
        cancelled: 'cancel', upcoming: 'update', unknown: 'help'
    };

    function openDetailView() {
        goto(resolveRoute(`/manga/[id]`, { id: String(series.id) }));
    }

    const ratingsHTML = $derived(Object.entries(series.source as { [key: string]: { id: string, rating?: number | null } } || {}).map(([key, value]) => {
        if (!value || !value.id) return '';
        const siteUrl = getSourceUrl(key, value.id);
        if (!siteUrl.startsWith('http')) return '';
        const siteName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        try {
            const domain = new URL(siteUrl).hostname;
            return `<a href="${siteUrl}" target="_blank" rel="noopener noreferrer" class="rating-link"><img src="https://www.google.com/s2/favicons?domain=${domain}" alt="${siteName} icon">${value.rating !== null && value.rating !== undefined ? (value.rating).toFixed(1) : 'N/A'}</a>`;
        } catch (_error: unknown) { /* eslint-disable-line @typescript-eslint/no-unused-vars */ return ''; }
    }).join(''));
</script>

<button class="search-result-item" class:list-view={viewMode === 'list'} class:grid-view={viewMode === 'grid'} onclick={openDetailView}>
    <img src={series.cover.x250.x1} class="cover" alt={series.title}>
    <div class="content">
        <h3>{series.title}</h3>
        <div class="search-metadata">
            <span><span class="material-symbols-outlined">book</span> {series.type}</span>
            <span><span class="material-symbols-outlined">calendar_month</span> {series.year}</span>
            <span><span class="material-symbols-outlined">{statusIcons[series.status] || 'help'}</span> {series.status}</span>
            <span><span class="material-symbols-outlined">verified</span> {series.is_licensed ? 'Licensed' : 'Not Licensed'}</span>
            <span><span class="material-symbols-outlined">closed_caption</span> {series.has_anime ? 'Has Anime' : 'No Anime'}</span>
            {#if series.final_volume}
                <span><span class="material-symbols-outlined">library_books</span> {series.final_volume} vols</span>
            {/if}
            {#if series.total_chapters}
                <span><span class="material-symbols-outlined">list_alt</span> {series.total_chapters} chs</span>
            {/if}
        </div>
        <div class="staff"><strong>Staff:</strong> {[...(series.authors || []), ...(series.artists || [])].join(', ')}</div>
        <div class="publishers"><strong>Publishers:</strong> {(series.publishers || []).map((p: { name: string }) => p.name).join(', ')}</div>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <div class="search-ratings">{@html ratingsHTML}</div>
    </div>
</button>