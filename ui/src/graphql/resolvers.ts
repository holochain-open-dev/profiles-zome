import { CallZome } from '../types';

/**
 * 
 * @param callZome callZome function from @holochain/hc-web-client
 * @param instanceId the instance id in which the profile zome is available
 * @param zome the profiles zome name, by default "profiles"
 */
export function setupProfilesResolvers(
  callZome: CallZome,
  instanceId: string,
  zome: string = 'profiles'
) {
  return {
    Query: {
      async allAgents(_, __) {
        const allAgents = await callZome(
          instanceId,
          zome,
          'get_all_agents'
        )({});
        return allAgents.map((agent) => ({
          id: agent.agent_id,
          username: agent.username,
        }));
      },
      async me(_, __) {
        const address = await callZome(instanceId, zome, 'get_my_address')({});
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
      username(parent, _, { cache }) {
        if (parent.username) return parent.username;

        const cachedAgent = cache['data'].data[parent.id];
        if (cachedAgent && cachedAgent.username) return cachedAgent.username;

        return callZome(
          instanceId,
          zome,
          'get_username'
        )({
          agent_address: parent.id,
        });
      },
    },
    Mutation: {
      async setUsername(_, { username }) {
        const agent = await callZome(
          instanceId,
          zome,
          'set_username'
        )({
          username,
        });
        return {
          id: agent.agent_id,
          username,
        };
      },
    },
  };
}
