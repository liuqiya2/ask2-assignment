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
        createTime: String
    }

    type ModelStatus {
        id: ID!
        type: ModelType!
        status: String!
        alpha: Float
        createTime: String
        waitTime: Float
    }

    type Query {
        modelStatus(modelId: ID!): ModelStatus!
        predict(modelId: ID!, x: Float!): Float!
        getAllModels: [Model!]!
    }

    type Mutation {
        createModel(data: [RegressionInput!]!, modelType: ModelType!, alpha: Float): Model
        deleteModel(modelId: ID!): Model
    }
`

export default typeDefs