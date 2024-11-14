const typeDefs = /* GraphQL */ `
    enum ModelType {
        LINEAR
        LASSO
        RIDGE
    }

    input RegressionInput {
        x: Float!
        y: Float!
    }

    type Model {
        id: ID!
        type: ModelType!
        status: String!
        alpha: Float
        createTime: Float
    }

    type ModelStatus {
        id: ID!
        type: ModelType!
        status: String!
        alpha: Float
        createTime: Float
        waitTime: Float
    }

    type Query {
        modelStatus(id: ID!): ModelStatus!
        predict(modelId: ID!, x: Float!): Float!
    }

    type Mutation {
        runRegression(
            data: [RegressionInput!]!,
            modelType: ModelType!,
            alpha: Float
        ): Model!
    }
`

export default typeDefs