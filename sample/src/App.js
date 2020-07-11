import React from 'react';
import { ErrorBoundary, SearchProvider, Results, SearchBox, ResultsPerPage, Paging, PagingInfo, Sorting, Facet } from "@elastic/react-search-ui";
import {
  BooleanFacet,
  Layout,
  SingleSelectFacet,
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
                  field="states"
                  label="States"
                  filterType="any"
                  isFilterable={true}
                />
                <Facet
                  field="world_heritage_site"
                  label="World Heritage Site?"
                  view={BooleanFacet}
                />
                <Facet
                  field="visitors"
                  label="Visitors"
                  view={SingleLinksFacet}
                />
                <Facet
                  field="date_established"
                  label="Date Established"
                  filterType="any"
                />
                <Facet
                  field="location"
                  label="Distance"
                  filterType="any"
                />
                <Facet
                  field="acres"
                  label="Acres"
                  view={SingleSelectFacet}
                />
              </div>
            }
          />
        </ErrorBoundary>
      </div>
    </SearchProvider>
  );

}