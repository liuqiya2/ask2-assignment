# GraphQL Regression Model Server
## Overview
The server offers an asynchronous way to run different types of regression models (Linear, Lasso, and Ridge) via GraphQL mutations. Since HTTP requests time out after 30 seconds, this design leverages asynchronous execution with a polling mechanism for the client to check model completion status.

## Key design decisions
1. **Asynchronous Model Execution:**
- Models are executed in an asynchronous "mock Python execution" using a JavaScript promise that resolves after 1 minute, simulating long-running tasks.
- This allows immediate responses from the server without waiting for the model execution to complete, avoiding HTTP timeout issues.

2. **Polling Mechanism with Estimated Completion Time:**
- The modelStatus query provides real-time status updates of a model’s execution. If a model is still in the PENDING state, the query returns the remaining time (in seconds) until the model completes.
- This design allows clients to poll the model status and estimate the time left for model completion.

3. **Error Handling with GraphQL Yoga:**
- The server utilizes `GraphQLError` to provide detailed error messages and uses custom error handling to log errors in the server console.
- By setting `onError` within Yoga’s configuration, errors are distinguished and logged as GraphQL or Unknown errors, aiding in debugging.

## Example Usage
### Starting the server
To start the server, run:
```bash
npx ts-node server.ts
```

### Queries and mutations
1. Run a regression model
```graphql
mutation {
  runRegression(
    data: [{ x: 1.0, y: 2.0 }, { x: 2.0, y: 4.0 }],
    modelType: LASSO,
    alpha: 0.1
  ) {
    id
    type
    status
    alpha
    createTime
  }
}
```

2. Check model status
```graphql
query {
  modelStatus(id: "<MODEL_ID>") {
    id
    type
    status
    waitTime
  }
}
```

3. Get prediction
```graphql
query {
  predict(modelId: "<MODEL_ID>", x: 5.0)
}
```