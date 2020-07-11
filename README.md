# search-ui-azure-connector

This connector is used to connect [Search UI](https://github.com/elastic/search-ui) to [Azure Cognitive Search](https://azure.microsoft.com/en-us/services/search/).

## Getting started

Install **React Search UI** and the **Azure Cognitive Search connector**.

```bash
npm install --save @elastic/react-search-ui search-ui-azure-connector
```

```javascript
import { AzureCognitiveSearchConnector } from "search-ui-azure-connector";

// We'll connect to the Azure Cognitive Search public sandbox and send a query
//  to its "nycjobs" index built from a public dataset of available jobs in New York
// https://www.npmjs.com/package/@azure/search-documents#send-your-first-search-query
const connector = new AzureCognitiveSearchConnector({
  endpoint: "https://azs-playground.search.windows.net/",
  queryKey: "252044BE3886FE4A8E3BAA4F595114BB",
  indexName: "nycjobs",
});

<SearchProvider
  config={{
    apiConnector: connector,
  }}
>
  <div className="App">{/* Place Components here! */}</div>
</SearchProvider>;
```

> If you would like to connect to your own Azure Cognitive Search instance, make sure to use the [query key](https://docs.microsoft.com/en-us/azure/search/search-security-api-keys) and not the admin key.

## Configuration

All configuration for Search UI is provided in a single configuration object, as documented [here](https://github.com/elastic/search-ui/blob/master/ADVANCED.md#advanced-configuration).

This connector supports the configuration possibilities of Search UI for filters, facets, autocomplete and suggestions. Specific Azure Cognitive Search configuration possibilities are documented below.

### Choose suggester

By default, the connector will use `sg` as the suggester name for autocomplete and suggestions. If you want to specify a custom [suggester](https://docs.microsoft.com/en-us/azure/search/index-add-suggesters), you can add it to your `results` and `suggestions` config.

```json
{
  "autocompleteQuery": {
    "results": {
      "suggester": "sg"
    },
    "suggestions": {
      "suggester": "sg"
    }
  }
}
```

If you specify fields in `result_fields`, make sure they exist in your suggester.
