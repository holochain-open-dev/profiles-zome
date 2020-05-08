(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@uprtcl/holochain-provider'), require('@uprtcl/micro-orchestrator'), require('lit-element'), require('@uprtcl/graphql'), require('@material/mwc-textfield'), require('@material/mwc-button'), require('graphql-tag')) :
  typeof define === 'function' && define.amd ? define(['exports', '@uprtcl/holochain-provider', '@uprtcl/micro-orchestrator', 'lit-element', '@uprtcl/graphql', '@material/mwc-textfield', '@material/mwc-button', 'graphql-tag'], factory) :
  (factory((global.hcProfiles = {}),global.holochainProvider,global.microOrchestrator,global.litElement,global.graphql,global.mwcTextfield,null,global.gql));
}(this, (function (exports,holochainProvider,microOrchestrator,litElement,graphql,mwcTextfield,mwcButton,gql) { 'use strict';

  gql = gql && gql.hasOwnProperty('default') ? gql['default'] : gql;

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
          username(parent, _, { container }) {
              const profilesProvider = container.get(ProfilesBindings.ProfilesProvider);
              return profilesProvider.call('get_username', {
                  agent_address: parent.id,
              });
          },
      },
      Mutation: {
          async setUsername(_, { username }, { container }) {
              const profilesProvider = container.get(ProfilesBindings.ProfilesProvider);
              const agentId = await profilesProvider.call('set_username', { username });
              return {
                  id: agentId,
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

  class SetUsername extends microOrchestrator.moduleConnect(litElement.LitElement) {
      constructor() {
          super(...arguments);
          this.usernameMinLength = 3;
      }
      firstUpdated() {
          this.client = this.request(graphql.ApolloClientModule.bindings.Client);
          this.usernameField.validityTransform = (newValue) => {
              this.requestUpdate();
              if (newValue.length < this.usernameMinLength) {
                  this.usernameField.setCustomValidity(`Username is too shot, min. ${this.usernameMinLength} characters`);
                  return {
                      valid: false,
                  };
              }
              return {
                  valid: true,
              };
          };
      }
      static get styles() {
          return litElement.css `
      .row {
        display: flex;
        flex-direction: row;
      }
      .column {
        display: flex;
        flex-direction: column;
      }
    `;
      }
      async setUsername() {
          const username = this.usernameField.value;
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
      render() {
          return litElement.html `
      <div class="column">
        <mwc-textfield
          id="username-field"
          @input=${() => this.usernameField.reportValidity()}
        ></mwc-textfield>
        <mwc-button
          .disabled=${!this.usernameField || !this.usernameField.validity.valid}
          label="SET USERNAME"
          @click=${() => this.setUsername()}
        ></mwc-button>
      </div>
    `;
      }
  }
  __decorate([
      litElement.query('#username-field'),
      __metadata("design:type", mwcTextfield.TextField)
  ], SetUsername.prototype, "usernameField", void 0);
  __decorate([
      litElement.property({ type: Number }),
      __metadata("design:type", Number)
  ], SetUsername.prototype, "usernameMinLength", void 0);

  class ProfilesModule extends microOrchestrator.MicroModule {
      constructor(instance) {
          super();
          this.instance = instance;
          this.dependencies = [holochainProvider.HolochainConnectionModule.id];
      }
      async onLoad(container) {
          const profilesProvider = holochainProvider.createHolochainProvider(this.instance, 'profiles');
          container.bind(ProfilesBindings.ProfilesProvider).to(profilesProvider);
          customElements.define('hcpf-set-username', SetUsername);
      }
      get submodules() {
          return [
              new graphql.GraphQlSchemaModule(profilesTypeDefs, resolvers),
              new microOrchestrator.i18nextModule('profiles', { en: en }),
          ];
      }
  }
  ProfilesModule.id = 'holochain-profile-module';
  ProfilesModule.bindings = ProfilesBindings;

  exports.ProfilesModule = ProfilesModule;
  exports.GET_ALL_AGENTS = GET_ALL_AGENTS;
  exports.SET_USERNAME = SET_USERNAME;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=hc-profiles.umd.js.map
