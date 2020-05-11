import { LitElement } from 'lit-element';
import { ApolloClient } from 'apollo-boost';
import { TextField } from '@material/mwc-textfield';
import '@material/mwc-button';
declare const SetUsername_base: {
    new (...args: any[]): import("@uprtcl/micro-orchestrator").ConnectedElement;
    prototype: any;
} & typeof LitElement;
export declare class SetUsername extends SetUsername_base {
    usernameField: TextField;
    usernameMinLength: number;
    existingUsernames: {};
    client: ApolloClient<any>;
    firstUpdated(): void;
    static get styles(): import("lit-element").CSSResult;
    setUsername(): Promise<void>;
    render(): import("lit-element").TemplateResult;
}
export {};
