export interface Result {
    query: string;
    documentId: string;
    tags: string[];
}

export enum Direction {
    Asc = "asc",
    Desc = "desc",
}

export interface RequestState {
    /**
     * Current page number
     */
    current?: number;
    filters?: any[]; // TODO
    /**
     * Number of results to show on each page
     */
    resultsPerPage?: number;
    /**
     * Search terms to search for
     */
    searchTerm?: string;
    /**
     * Direction to sort
     */
    sortDirection?: Direction | string;
    /**
     * Name of field to sort on
     */
    sortField?: any;
}

export interface ResponseState {
    autocompletedResults?: Result[];
    autocompletedResultsRequestId?: string;
    autocompletedSuggestions?: any;
    autocompletedSuggestionsRequestId?: string;
    facets?: any;
    requestId?: string;
    results?: Result[];
    resultSearchTerm?: string;
    totalResults?: number;
    totalPages?: number; // Missing in https://github.com/elastic/search-ui/blob/master/ADVANCED.md#response-state
}

export interface QueryConfig {
    facets?: any;
    disjunctiveFacets?: string[];
    disjunctiveFacetsAnalyticsTags?: string[];
    conditionalFacets?: any;
    search_fields?: any;
    result_fields?: any;
}