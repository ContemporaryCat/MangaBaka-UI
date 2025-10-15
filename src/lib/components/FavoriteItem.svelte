<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolveRoute } from '$app/paths';
    import { favoritesStore } from '$lib/stores/favoritesStore';
    import { updateFavoriteApi } from '$lib/api';
    import DropdownMenu from './DropdownMenu.svelte';
    import type { Favorite } from '$lib/types';

    let { fav, viewMode } = $props<{ fav: Favorite, viewMode: 'list' | 'grid' }>();

    const statusText: { [key: string]: string } = { reading: 'Reading', completed: 'Completed', paused: 'On Hold', dropped: 'Dropped', plan_to_read: 'Plan to Read' };
    const totalChapters = $derived(parseInt(fav.Series.total_chapters, 10) || 0);
    const progress = $derived(parseInt(fav.progress_chapter, 10) || 0);
    const isUnread = $derived(totalChapters > 0 && progress < totalChapters);
    const percentage = $derived(totalChapters > 0 ? (progress / totalChapters) * 100 : 0);
    const barColorClass = $derived(fav.state === 'completed' ? 'bg-blue' : 'bg-green');
    const imageUrl = $derived(fav.Series.cover.x250.x1 || '');

    let showDropdown = $state(false);

    function openDetailView() {
        goto(resolveRoute(`/manga/[id]`, { id: String(fav.series_id) }));
    }

    async function handleAction(action: string) {
        switch (action) {
            case 'open':
                openDetailView();
                break;
            case 'increment':
                if (totalChapters > 0 && progress < totalChapters) {
                    const updatedFav = await updateFavoriteApi(fav.series_id, { progress_chapter: progress + 1 });
                    favoritesStore.updateFavorite(fav.series_id, { progress_chapter: updatedFav.progress_chapter });
                }
                break;
            case 'latest':
                if (totalChapters > 0 && progress < totalChapters) {
                    const updatedFav = await updateFavoriteApi(fav.series_id, { progress_chapter: totalChapters });
                    favoritesStore.updateFavorite(fav.series_id, { progress_chapter: updatedFav.progress_chapter });
                }
                break;
        }
    }

    const dropdownItems = [
        { label: 'Open', icon: 'open_in_new', action: 'open' },
        { label: 'Increment Chapter', icon: 'add', action: 'increment' },
        { label: 'Set to Latest', icon: 'last_page', action: 'latest' },
    ];
</script>

<li class="favorite-item" class:list-view={viewMode === 'list'} class:grid-view={viewMode === 'grid'}>
    {#if viewMode === 'grid'}
        <div class="cover-image-container">
            <span class="unread-indicator" class:visible={isUnread}></span>
            <img src={imageUrl} alt={fav.Series.title} class="cover-image">
            <div class="actions-overlay">
                <button class="action-btn" title="More actions" onclick={() => showDropdown = !showDropdown}>
                    <span class="material-symbols-outlined">more_vert</span>
                </button>
                {#if showDropdown}
                    <DropdownMenu items={dropdownItems} on:select={e => handleAction(e.detail)} on:close={() => showDropdown = false} />
                {/if}
            </div>
        </div>
    {/if}
    <div class="favorite-details">
        <div class="list-item-content">
            <div class="list-item-main">
                {#if viewMode === 'list'}
                    <span class="unread-indicator" class:visible={isUnread}></span>
                {/if}
                <button class="title-text" onclick={openDetailView}>{fav.Series.title}</button>
            </div>
            <div class="list-item-status"><span class="info-tag status-tag status-{fav.state}">{statusText[fav.state] || 'N/A'}</span></div>
            <div class="list-item-progress">
                {#if totalChapters > 0}
                    <div class="progress-wrapper">
                        <div class="progress-container"><div class="progress-bar {barColorClass}" style="width: {percentage}%"></div></div>
                        <span class="progress-text">{progress}/{totalChapters}</span>
                    </div>
                {/if}
            </div>
            <div class="list-item-latest">{#if totalChapters > 0}<span class="info-tag">Ch. {totalChapters}</span>{/if}</div>
        </div>
    </div>
    {#if viewMode === 'list'}
        <div class="list-item-actions">
            <button class="action-btn" title="More actions" onclick={() => showDropdown = !showDropdown}>
                <span class="material-symbols-outlined">more_vert</span>
            </button>
            {#if showDropdown}
                <DropdownMenu items={dropdownItems} on:select={e => handleAction(e.detail)} on:close={() => showDropdown = false} />
            {/if}
        </div>
    {/if}
</li>