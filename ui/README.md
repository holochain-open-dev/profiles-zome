# @holochain-open-dev/profiles-zome

This is a prototype module that exports GraphQl type defs and resolvers to connect with the profiles zome backend [here](https://github.com/holochain-open-dev/profiles-zome).

It also offers native web components you can use in any browser and framework.

## Usage

1. Add the GraphQl type definitions to your ApolloClient: 

``` js
import {
    profileTypeDefs
} from '@holochain-open-dev/profiles-zome';
import { ApolloClient } from '@apollo/client/core';

const apolloClient = new ApolloClient({
    typeDefs: [profileTypeDefs, ...otherTypeDefs],
    ...
});
```

If you're using the `SchemaLink` and `makeExecutableSchema` approach, then import the resolvers to make your executable schema:

``` js
import {
    setupProfilesResolvers
} from '@holochain-open-dev/profiles-zome';
import { connect } from '@holochain/hc-web-client';

const { callZome } = await connect({ url: 'ws://localhost:888' });

const profilesResolvers = setupProfilesResolvers(callZome, 'test-instance', 'profiles');

const executableSchema = makeExecutableSchema({
    typeDefs: [profileTypeDefs, ...otherTypeDefs],
    resolvers: {
        ...profilesResolvers,
        ...otherResolvers
    }
});

const schemaLink = new SchemaLink({
    schema: executableSchema,
    ...
});


const apolloClient = new ApolloClient({
    typeDefs: [profileTypeDefs, ...otherTypeDefs],
    link: schemaLink,
    ...
});
```

2. Install the web components:

```js
import { installProfilesModule } from '@holochain-open-dev/profiles-zome';

installProfilesModule({ apolloClient: apolloClient });
```

Too see a working demo of this, see [here](https://github.com/holochain-open-dev/profiles-zome/tree/master/ui/demo).