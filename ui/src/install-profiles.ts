import { ApolloClient, DocumentNode } from '@apollo/client/core';
import { profilesTypeDefs } from './graphql/schema';
import { setUsername } from './elements/hcpf-set-username';

export function checkSchemaInClient(
  apolloClient: ApolloClient<any>,
  schema: DocumentNode
): boolean {
  if (!Array.isArray(apolloClient.typeDefs)) return false;

  return apolloClient.typeDefs.includes(schema as any);
}

export interface ProfilesModuleInput {
  apolloClient: ApolloClient<any>;
}

/**
 * Install function
 * @param options
 */
export function installProfilesModule(options: ProfilesModuleInput): void {
  if (!checkSchemaInClient(options.apolloClient, profilesTypeDefs)) {
    throw new Error(
      'The given ApolloClient must be initialized with the profileTypeDefs included'
    );
  }

  customElements.define(
    'hod-pro-set-username',
    setUsername(options.apolloClient)
  );
}
