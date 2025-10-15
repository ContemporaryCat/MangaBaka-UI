import { writable } from 'svelte/store';
import type { Favorite, Series } from '../types';

interface LocalFavorite extends Favorite {
	Series: Series;
}

const favoritesMap = writable<Map<number, LocalFavorite>>(new Map());

export const favoritesStore = {
	subscribe: favoritesMap.subscribe,
	set: favoritesMap.set,
	update: favoritesMap.update,
	addFavorite: (favorite: LocalFavorite) => {
		favoritesMap.update((map) => {
			map.set(favorite.series_id, favorite);
			return map;
		});
	},
	updateFavorite: (seriesId: number, payload: Partial<LocalFavorite>) => {
		favoritesMap.update((map) => {
			const existingFav = map.get(seriesId);
			if (existingFav) {
				map.set(seriesId, { ...existingFav, ...payload });
			}
			return map;
		});
	},
	getFavorite: (seriesId: number) => {
		let fav: LocalFavorite | undefined;
		favoritesMap.subscribe((map) => {
			fav = map.get(seriesId);
		})();
		return fav;
	}
};
