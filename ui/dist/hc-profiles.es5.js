import { HolochainConnectionModule, createHolochainProvider } from '@uprtcl/holochain-provider';
import { moduleConnect, MicroModule, i18nextModule } from '@uprtcl/micro-orchestrator';
import { LitElement, css, html, query, property } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import { ApolloClientModule, GraphQlSchemaModule } from '@uprtcl/graphql';
import { TextField } from '@material/mwc-textfield';
import '@material/mwc-button';
import gql from 'graphql-tag';

var en = {
	
};

const ProfilesBindings = {
    ProfilesProvider: "holochain-profiles-provider"
};

const profilesTypeDefs = gql `
  type Agent {
    id: ID!
    username: String
  }

  type Me {
    id: ID!
    agent: Agent!
  }

  extend type Query {
    allAgents: [Agent!]!
    me: Me!
  }

  extend type Mutation {
    setUsername(username: String!): Agent!
  }
`;

const resolvers = {
    Query: {
        async allAgents(_, __, { container }) {
            const profilesProvider = container.get(ProfilesBindings.ProfilesProvider);
            const allAgents = await profilesProvider.call('get_all_agents', {});
            return allAgents.map((agent) => ({
                id: agent.agent_id,
                username: agent.username,
            }));
        },
        async me(_, __, { container }) {
            const profilesProvider = container.get(ProfilesBindings.ProfilesProvider);
            const address = await profilesProvider.call('get_my_address', {});
            return { id: address };
        },
    },
    Me: {
        agent(parent) {
            return { id: parent.id };
        },
    },
    Agent: {
        id(parent) {
            return parent.id;
        },
        username(parent, _, { container, cache }) {
            if (parent.username)
                return parent.username;
            const cachedAgent = cache['data'].data[parent.id];
            if (cachedAgent && cachedAgent.username)
                return cachedAgent.username;
            const profilesProvider = container.get(ProfilesBindings.ProfilesProvider);
            return profilesProvider.call('get_username', {
                agent_address: parent.id,
            });
        },
    },
    Mutation: {
        async setUsername(_, { username }, { container }) {
            const profilesProvider = container.get(ProfilesBindings.ProfilesProvider);
            const agent = await profilesProvider.call('set_username', { username });
            return {
                id: agent.agent_id,
                username,
            };
        },
    },
};

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

const SET_USERNAME = gql `
  mutation SetUsername($username: String!) {
    setUsername(username: $username) {
      id
      username
    }
  }
`;
const GET_ALL_AGENTS = gql `
  query GetAllAgents {
    allAgents {
      id
      username
    }
  }
`;

class SetUsername extends moduleConnect(LitElement) {
    constructor() {
        super(...arguments);
        this.usernameMinLength = 3;
        this.existingUsernames = {};
    }
    firstUpdated() {
        this.client = this.request(ApolloClientModule.bindings.Client);
        this.usernameField.validityTransform = (newValue) => {
            this.requestUpdate();
            if (newValue.length < this.usernameMinLength) {
                this.usernameField.setCustomValidity(`Username is too shot, min. ${this.usernameMinLength} characters`);
                return {
                    valid: false,
                };
            }
            else if (this.existingUsernames[newValue]) {
                this.usernameField.setCustomValidity('This username already exists');
                return { valid: false };
            }
            return {
                valid: true,
            };
        };
    }
    static get styles() {
        return css `
      .row {
        display: flex;
        flex-direction: row;
      }
      .column {
        display: flex;
        flex-direction: column;
      }
      .small-margin {
        margin-top: 6px;
      }
      .big-margin {
        margin-top: 23px;
      }
    `;
    }
    async setUsername() {
        const username = this.usernameField.value;
        try {
            await this.client.mutate({
                mutation: SET_USERNAME,
                variables: {
                    username,
                },
            });
            this.dispatchEvent(new CustomEvent('username-set', {
                detail: { username },
                bubbles: true,
                composed: true,
            }));
        }
        catch (e) {
            this.existingUsernames[username] = true;
            this.usernameField.reportValidity();
        }
    }
    render() {
        return html `
      <div class="column">
        <mwc-textfield
          id="username-field"
          outlined
          @input=${() => this.usernameField.reportValidity()}
        ></mwc-textfield>
        <mwc-button
          raised
          class=${classMap({
            'small-margin': !!this.usernameField,
            'big-margin': !this.usernameField,
        })}
          .disabled=${!this.usernameField || !this.usernameField.validity.valid}
          label="SET USERNAME"
          @click=${() => this.setUsername()}
        ></mwc-button>
      </div>
    `;
    }
}
__decorate([
    query('#username-field'),
    __metadata("design:type", TextField)
], SetUsername.prototype, "usernameField", void 0);
__decorate([
    property({ type: Number }),
    __metadata("design:type", Number)
], SetUsername.prototype, "usernameMinLength", void 0);

class ProfilesModule extends MicroModule {
    constructor(instance) {
        super();
        this.instance = instance;
        this.dependencies = [HolochainConnectionModule.id];
    }
    async onLoad(container) {
        const profilesProvider = createHolochainProvider(this.instance, 'profiles');
        container.bind(ProfilesBindings.ProfilesProvider).to(profilesProvider);
        customElements.define('hcpf-set-username', SetUsername);
    }
    get submodules() {
        return [
            new GraphQlSchemaModule(profilesTypeDefs, resolvers),
            new i18nextModule('profiles', { en: en }),
        ];
    }
}
ProfilesModule.id = 'holochain-profile-module';
ProfilesModule.bindings = ProfilesBindings;

export { ProfilesModule, GET_ALL_AGENTS, SET_USERNAME };
//# sourceMappingURL=hc-profiles.es5.js.map
