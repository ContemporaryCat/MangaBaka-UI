import { fetchApi } from '$lib/api';
import type { PageLoad } from './$types';
import type { ApiResponse } from '$lib/types';

export const load: PageLoad = async () => {
	try {
		const genreData = await fetchApi<ApiResponse<string[]>>('/genres');
		const genres = genreData.data.map((g: string) => ({ value: g, label: g }));
		return { genres };
	} catch (error) {
		console.error('Could not load genres', error);
		return { genres: [] };
	}
};
