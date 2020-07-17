import { connect } from '@holochain/hc-web-client';
import { makeExecutableSchema } from 'graphql-tools';
import { SchemaLink } from '@apollo/client/link/schema';
import { InMemoryCache } from '@apollo/client';
import { ApolloClient } from '@apollo/client/core';
import {
  profilesTypeDefs,
  setupProfilesResolvers,
  installProfilesModule,
} from '../dist/hod-profiles.es5';

async function loadApp() {
  const { callZome } = await connect({ url: 'ws://localhost:888' });

  const profilesResolvers = setupProfilesResolvers(
    callZome,
    'test-instance',
    'profiles'
  );

  const executableSchema = makeExecutableSchema({
    typeDefs: [profilesTypeDefs, ...otherTypeDefs],
    resolvers: profilesResolvers,
  });

  const schemaLink = new SchemaLink({
    schema: executableSchema,
    context: {},
  });

  const apolloClient = new ApolloClient({
    typeDefs: [profileTypeDefs, ...otherTypeDefs],
    link: schemaLink,
    cache: new InMemoryCache(),
  });

  installProfilesModule({ apolloClient: apolloClient });
}

loadApp();
