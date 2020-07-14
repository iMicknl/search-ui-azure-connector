import { Result, RequestState, QueryConfig, ResponseState } from './models';
import { SearchClient, SearchClientOptions, AzureKeyCredential, AutocompleteMode, odata } from '@azure/search-documents'

/**
 * Settings used to configure a `AzureCognitiveSearchConnector` instance.
 */
export interface AzureCognitiveSearchConnectorSettings {
    endpoint: string;
    queryKey: string;
    indexName: string;
    options?: SearchClientOptions
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

        // TODO Support full Facet syntax Rooms/BaseRate,interval:100"

        let searchFilters = '';

        if (state.filters && state.filters.length > 0) {
            for (const facet of state.filters) {
                const name = facet.field;
                const values = facet.values;

                // TODO Create a way to parse filters to odata notation
                if (values.length === 1) {
                    searchFilters += `${name} eq "${values[0]}"`
                }
            }
        }

        console.log(state.filters)

        const searchResults = await this.client.search(
            state.searchTerm,
            {
                top: state.resultsPerPage,
                includeTotalCount: true,
                ...(state.sortField && state.sortDirection && { orderBy: [`${state.sortField} ${state.sortDirection}`] }),
                ...(queryConfig.search_fields && { searchFields: Object.keys(queryConfig.search_fields) }), // SearchFields
                ...(queryConfig.result_fields && { select: Object.keys(queryConfig.result_fields) }), // Select
                ...(state.current && state.resultsPerPage && { skip: (state.current - 1) * state.resultsPerPage }), // Skip
                ...(queryConfig.facets && { facets: Object.keys(queryConfig.facets) }), // Facets
                ...(searchFilters && { filter: odata`${searchFilters}` }), // Filter
            }
        );

        // TODO Rewrite using helper function or array.map()
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

        const facets: any = {};

        // TODO Rewrite using helper function or array.map()
        if (searchResults.facets) {

            for (const facet in searchResults.facets) {
                const values = searchResults.facets[facet];

                facets[facet] = [{
                    type: "value",
                    data: []
                }];

                for (const value of values) {
                    facets[facet][0].data.push(
                        {
                            "value": (value as any).value,
                            "count": (value as any).count
                        }
                    )
                }
            }

        }

        const totalResults = searchResults.count ? searchResults.count : 0
        const totalPages = state.resultsPerPage ? Math.ceil(totalResults / state.resultsPerPage) : 0

        return {
            results: results,
            totalPages,
            totalResults,
            requestId: "",
            facets
        }
    }

    /**
     * 
     * @param state 
     * @param queryConfig 
     */
    public async onAutocomplete(state: RequestState, queryConfig: any): Promise<ResponseState> {

        const searchText = (state.searchTerm ? state.searchTerm : '')

        // Autocomplete Results
        const resultsPerPage = queryConfig?.results?.resultsPerPage;
        const resultFields = Object.keys(queryConfig?.results?.result_fields);
        const autocompleteMode: AutocompleteMode = queryConfig?.results?.autocompleteMode;
        const autocompleteSuggesterName = (queryConfig?.results?.suggester ? queryConfig.results.suggester : 'sg')

        const autoCompleteSettings = {
            ...(autocompleteMode && { autocompleteMode: autocompleteMode }),
            ...(resultsPerPage && { top: resultsPerPage }),
            ...(resultFields && { searchFields: resultFields })
        }

        let autoCompleteResult: any[] = [];

        // TODO Remove try catch in favor for built-in ErrorBoundary
        try {
            const autocomplete = await this.client.autocomplete(searchText, autocompleteSuggesterName, autoCompleteSettings);
            autoCompleteResult = (autocomplete.results).map(({ queryPlusText: suggestion }) => ({ suggestion }));
        } catch (error) {
            console.error(error)
        }


        // TODO Implement size parameter
        // TODO Implement multiple types

        // Document suggestions
        const suggestionSuggesterName = (queryConfig?.suggestions?.suggester ? queryConfig.suggestions.suggester : 'sg')
        const suggestionFields = '';
        const suggestionResults: any[] = []

        try {
            const suggest = await this.client.suggest(searchText, suggestionSuggesterName)

            // TODO Rewrite using helper function or array.map()
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
                [`${searchText}_${suggestionSuggesterName}`]: autoCompleteResult
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