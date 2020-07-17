export interface Agent {
  id: string;
  username: string;
}

export declare type CallZome = (instanceId: string, zome: string, func: string) => (params: any) => Promise<any>;