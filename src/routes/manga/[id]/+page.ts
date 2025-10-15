import { fetchApi } from '$lib/api';
import { favoritesStore } from '$lib/stores/favoritesStore';
import type { PageLoad } from './$types';
import type { ApiResponse, Series } from '$lib/types';

export const load: PageLoad = async ({ params }) => {
	const seriesId = parseInt(params.id);

	const fav = favoritesStore.getFavorite(seriesId);
	let seriesData: Series;

	if (fav) {
		seriesData = fav.Series;
	} else {
		const response = await fetchApi<ApiResponse<Series>>(`/series/${seriesId}`);
		seriesData = response.data;
	}

	return {
		seriesId,
		series: seriesData,
		favorite: fav
	};
};
