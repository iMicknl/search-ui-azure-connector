import React from 'react';
import { ErrorBoundary, SearchProvider, Results, SearchBox, ResultsPerPage, Paging, PagingInfo, Sorting, Facet } from "@elastic/react-search-ui";
import {
  Layout,
  SingleLinksFacet
} from "@elastic/react-search-ui-views";

import { AzureCognitiveSearchConnector } from 'search-ui-azure-connector'

import "@elastic/react-search-ui-views/lib/styles/styles.css";

export default function App() {

  const connector = new AzureCognitiveSearchConnector({
    endpoint: "https://azs-playground.search.windows.net/",
    queryKey: "252044BE3886FE4A8E3BAA4F595114BB",
    indexName: "nycjobs"
  });

  return (
    <SearchProvider
      config={
        {
          alwaysSearchOnInitialLoad: true,
          apiConnector: connector,
          searchQuery: {
            result_fields: {
              id: {},
              job_id: {},
              posting_date: {},
              business_title: {},
              preferred_skills: {},
              job_description: {}
            },
            // disjunctiveFacets: ["salary_frequency"],
            facets: {
              business_title: {},
              posting_type: {}
            }
          },
          autocompleteQuery: {
            results: {
              resultsPerPage: 5,
              suggester: "sg",
              result_fields: {
                business_title: {}
              }
            },
            suggestions: {
              types: {
                documents: {
                  fields: ["business_title"]
                }
              },
              size: 4,
              suggester: "sg"
            }
          }
        }
      }
    >
      <div className="App">
        <ErrorBoundary>
          <Layout
            header={<SearchBox
              autocompleteMinimumCharacters={1}
              //searchAsYouType={true}
              autocompleteResults={{
                key: "id",
                linkTarget: "_self",
                sectionTitle: "Results",
                titleField: "text",
                urlField: "job_id",
              }}
              autocompleteSuggestions={true}
              debounceLength={0}
            />}
            bodyContent={<Results key="id" titleField="business_title" urlField="job_id" linkTarget="_self" />}
            bodyHeader={
              <React.Fragment>
                <PagingInfo />
                <Paging />
                <ResultsPerPage />
              </React.Fragment>
            }
            bodyFooter={<Paging />}
            sideContent={
              <div>
                <Sorting label={"Sort by"} sortOptions={[
                  {
                    name: "Relevance",
                    value: "",
                    direction: ""
                  },
                  {
                    name: "Posting Date",
                    value: "posting_date",
                    direction: "desc"
                  },
                  {
                    name: "Title",
                    value: "business_title",
                    direction: "asc"
                  }
                ]} />

                <Facet
                  field="business_title"
                  label="Business Title"
                  filterType="any"
                  isFilterable={true}
                />

                <Facet
                  field="posting_type"
                  label="Posting Type"
                  filterType="any"
                  isFilterable={true}
                  view={SingleLinksFacet}
                />

              </div>
            }
          />
        </ErrorBoundary>
      </div>
    </SearchProvider>
  );

}