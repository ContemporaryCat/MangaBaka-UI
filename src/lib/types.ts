export interface Series {
	id: number;
	title: string;
	secondary_titles?: { [key: string]: { title: string }[] };
	cover: { x250: { x1: string }; x350: { x1: string } };
	description: string;
	type: string;
	status: string;
	year: number;
	content_rating: string;
	is_licensed: boolean;
	has_anime: boolean;
	final_volume?: number;
	total_chapters?: number;
	authors?: string[];
	artists?: string[];
	anime?: { start: string; end: string };
	publishers?: { type: string; name: string; note?: string }[];
	source?: { [key: string]: { id: string; rating?: number } };
	links?: string[];
	genres?: string[];
	tags?: string[];
	relationships?: { [key: string]: number[] };
}

export interface Favorite {
	series_id: number;
	progress_chapter?: number | null;
	progress_volume?: number | null;
	state: 'reading' | 'completed' | 'paused' | 'dropped' | 'plan_to_read';
	rating: number | null;
	Series: Series;
}

export interface Pagination {
	count: number;
	next: string | null;
	previous: string | null;
}

export interface ApiResponse<T> {
	data: T;
	pagination: Pagination;
}

export interface Genre {
	value: string;
	label: string;
}

export interface RelatedSeries extends Series {
	relationType: string;
}
