import gql from 'graphql-tag';

export const profilesTypeDefs = gql`
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
