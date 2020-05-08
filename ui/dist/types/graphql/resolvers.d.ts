export declare const resolvers: {
    Query: {
        allAgents(_: any, __: any, { container }: {
            container: any;
        }): Promise<any>;
        me(_: any, __: any, { container }: {
            container: any;
        }): Promise<{
            id: any;
        }>;
    };
    Me: {
        agent(parent: any): {
            id: any;
        };
    };
    Agent: {
        id(parent: any): any;
        username(parent: any, _: any, { container }: {
            container: any;
        }): Promise<any>;
    };
    Mutation: {
        setUsername(_: any, { username }: {
            username: any;
        }, { container }: {
            container: any;
        }): Promise<{
            id: any;
            username: any;
        }>;
    };
};
