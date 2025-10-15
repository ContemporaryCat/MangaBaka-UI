import type { Favorite } from './types';

const apiKey = 'mb-pQzTkNoHOHdhdxaZzziBheEufkdxdRepOLkxzDESEyDkpbPXmzfNeubtSAdPPSAH';
const baseApiUrl = 'https://api.mangabaka.dev/v1';

async function _rawFetchApi<T>(endpoint: string): Promise<T> {
	const response = await fetch(`${baseApiUrl}${endpoint}`, { headers: { 'x-api-key': apiKey } });
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
	}
	return response.json();
}

const requestQueue: {
	endpoint: string;
	resolve: (value: unknown) => void;
	reject: (reason?: unknown) => void;
}[] = [];
let isProcessing = false;
const RATE_LIMIT_DELAY = 100; // 100ms to be safe for 120 requests/minute (500ms per request)

async function processQueue() {
	if (isProcessing || requestQueue.length === 0) return;
	isProcessing = true;

	while (requestQueue.length > 0) {
		const { endpoint, resolve, reject } = requestQueue.shift()!;
		try {
			const data = await _rawFetchApi(endpoint);
			resolve(data);
		} catch (error) {
			reject(error);
		}
		await new Promise((res) => setTimeout(res, RATE_LIMIT_DELAY));
	}

	isProcessing = false;
}

export function fetchApi<T>(endpoint: string): Promise<T> {
	return new Promise((resolve, reject) => {
		requestQueue.push({ endpoint, resolve: resolve as (value: unknown) => void, reject });
		processQueue();
	});
}

export async function updateFavoriteApi(
	seriesId: number,
	payload: Partial<Favorite>
): Promise<Favorite> {
	const response = await fetch(`${baseApiUrl}/my/favorites/${seriesId}`, {
		method: 'PATCH',
		headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || 'Failed to update favorite');
	}
	return response.json();
}

export async function addToFavoritesApi(seriesId: number): Promise<Favorite> {
	const response = await fetch(`${baseApiUrl}/my/favorites/${seriesId}`, {
		method: 'POST',
		headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
		body: JSON.stringify({ state: 'plan_to_read' })
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || 'Failed to add to favorites');
	}
	return response.json();
}

export function getSourceUrl(key: string, id: string) {
	const urls: { [key: string]: string } = {
		anilist: 'https://anilist.co/manga/',
		my_anime_list: 'https://myanimelist.net/manga/',
		manga_updates: 'https://www.mangaupdates.com/series.html?id=',
		anime_planet: 'https://www.anime-planet.com/manga/',
		kitsu: 'https://kitsu.io/manga/',
		mangadex: 'https://mangadex.org/title/',
		shikimori: 'https://shikimori.one/mangas/'
	};
	if (key === 'manga_updates' && !/^\d+$/.test(id)) {
		return `https://www.mangaupdates.com/series/${id}`;
	}
	return (urls[key] || '#') + id;
}
