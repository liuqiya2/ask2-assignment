import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLError } from 'graphql';
import typeDefs from './schema';
import resolvers from './resolver';

const executableSchema = makeExecutableSchema({
    typeDefs,
    resolvers
});

const { createYoga } = require('graphql-yoga');
const { createServer } = require('http');

const yoga = createYoga({
    schema: executableSchema,
    onError: ({ error }: { error: any }) => {
      if (error instanceof GraphQLError) {
        console.error("GraphQL Error:", error.message);
      } else {
        console.error("Unknown Error:", error);
      }
    },
    context: async ({ request }: { request: any }) => {
      // get custom header value
      const userId = request.headers.get('userId') ?? null
      return { userId }
    }
  });  

const server = createServer(yoga);

server.listen(4001, () => {
    console.log('Yoga is listening at http://localhost:4001/graphql');
});