import { SearchClient, SearchClientOptions, AzureKeyCredential, AutocompleteMode } from '@azure/search-documents'

/**
 * Settings used to configure a `AzureCognitiveSearchConnector` instance.
 */
export interface AzureCognitiveSearchConnectorSettings {
    endpoint: string;
    queryKey: string;
    indexName: string;
    options?: SearchClientOptions
}

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
    sortDirection?: any;
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

/**
 * Azure Cognitive Search connector for Search UI
 * https://github.com/elastic/search-ui/blob/master/ADVANCED.md#connectors-and-handlers
 */
export class AzureCognitiveSearchConnector {

    protected readonly settings: AzureCognitiveSearchConnectorSettings;
    protected readonly client: SearchClient<any>;

    constructor(settings: AzureCognitiveSearchConnectorSettings) {
        this.settings = settings

        if (!this.settings.endpoint || !this.settings.queryKey || !this.settings.indexName) {
            throw new Error(`AzureCognitiveSearchConnector.constructor(): required AzureCognitiveSearchConnectorSettings missing.`);
        }

        this.client = new SearchClient(
            this.settings.endpoint,
            this.settings.indexName,
            new AzureKeyCredential(this.settings.queryKey),
            this.settings?.options
        );
    }

    /**
     * 
     * @param result 
     */
    public async onResultClick(result: Result) {
        // TODO add Application Insights logging
        console.warn("onResultClick() not implemented.")
    }

    /**
     * 
     * @param result 
     */
    public async onAutocompleteResultClick(result: Result) {
        // TODO add Application Insights logging
        console.warn("onAutocompleteResultClick() not implemented.")
    }

    /**
     * 
     * @param state 
     * @param queryConfig 
     */
    public async onSearch(state: RequestState, queryConfig: QueryConfig): Promise<ResponseState> {

        const searchResults = await this.client.search(
            state.searchTerm,
            {
                top: state.resultsPerPage,
                includeTotalCount: true,
                ...(state.sortField && state.sortDirection && { orderBy: [`${state.sortField} ${state.sortDirection}`] }),
                ...(queryConfig.search_fields && { searchFields: Object.keys(queryConfig.search_fields) }), // SearchFields
                ...(queryConfig.result_fields && { select: Object.keys(queryConfig.result_fields) }), // Select
                ...(state.current && state.resultsPerPage && { skip: (state.current - 1) * state.resultsPerPage }) // Skip
            }
        );

        // Temp workaround
        const results: any[] = []
        for await (const result of searchResults.results) {
            let document: any = result.document;

            for (const key in document) {
                document[key] = {
                    raw: document[key],
                    snippet: document[key]
                }
            }

            results.push(document)
        }

        const totalResults = searchResults.count ? searchResults.count : 0
        const totalPages = state.resultsPerPage ? Math.ceil(totalResults / state.resultsPerPage) : 0

        return {
            results: results,
            totalPages,
            totalResults,
            requestId: ""
        }
    }

    /**
     * 
     * @param state 
     * @param queryConfig 
     */
    public async onAutocomplete(state: RequestState, queryConfig: any): Promise<ResponseState> {

        const searchText = (state.searchTerm ? state.searchTerm : '')
        const suggesterName = (queryConfig?.results?.suggester ? queryConfig.results.suggester : 'sg')

        // Autocomplete Results
        const resultsPerPage = queryConfig.results.resultsPerPage;
        const resultFields = Object.keys(queryConfig?.results?.result_fields);

        // Possible values include: 'oneTerm', 'twoTerms', 'oneTermWithContext'

        const autoCompleteSettings = {
            autocompleteMode: 'twoTerms' as AutocompleteMode,
            ...(resultsPerPage && { top: resultsPerPage }),
            ...(resultFields && { searchFields: resultFields })
        }

        let autoCompleteResult: any[] = [];

        try {
            const autocomplete = await this.client.autocomplete(searchText, suggesterName, autoCompleteSettings);
            autoCompleteResult = (autocomplete.results).map(({ queryPlusText: suggestion }) => ({ suggestion }));
        } catch (error) {
            console.error(error)
        }


        // Document suggestions
        const suggestionResults: any[] = []

        try {
            const suggest = await this.client.suggest(searchText, suggesterName)

            // Temp workaround
            for await (const result of suggest.results) {
                let document: any = result.document;
                document["text"] = result.text;

                for (const key in document) {
                    document[key] = {
                        raw: document[key],
                        snippet: document[key]
                    }
                }

                suggestionResults.push(document)
            }
        } catch (error) {
            console.error(error)
        }


        return {
            autocompletedResults: suggestionResults,
            autocompletedSuggestions: {
                [`${searchText}_${suggesterName}`]: autoCompleteResult
            }
        }

    }

    /**
     * 
     * @param documentId 
     */
    public async getResult(documentId: string) {

        if (!documentId) {
            return
        }

        const document = await this.client.getDocument(documentId);

        return document;
    }

}