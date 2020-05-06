#![feature(proc_macro_hygiene)]
#![allow(dead_code)]
#![allow(unused_imports)]

use crate::profile::{BooleanReturn, Profile};
use hdk::{
    entry_definition::ValidatingEntryType, error::ZomeApiResult,
    holochain_persistence_api::cas::content::Address,
};
use hdk_proc_macros::zome;
use serde_derive::{Deserialize, Serialize};
pub mod profile;
pub mod username;

// MAIN FILE FOR THE PROFILE ZOME
// contains calls to entry definitions and functions.

// Crate              Modules
// profile __________ mod
//            |______ handlers
//            |______ strings

#[zome]
mod profile_zome {

    use crate::{profile::Username, username as username_mod};

    #[init]
    fn init() {
        Ok(())
    }

    #[validate_agent]
    pub fn validate_agent(validation_data: EntryValidationData<AgentId>) {
        Ok(())
    }

    // ENTRY DEFINITIONS
    #[entry_def]
    fn profile_def() -> ValidatingEntryType {
        profile::profile_definition()
    }

    #[entry_def]
    fn username_def() -> ValidatingEntryType {
        profile::username_definition()
    }

    #[entry_def]
    fn anchor_def() -> ValidatingEntryType {
        holochain_anchors::anchor_definition()
    }

    // FRONTEND FUNCTIONS

    #[zome_fn("hc_public")]
    fn create_profile(
        username: String,
    ) -> ZomeApiResult<Profile> {
        profile::handlers::create_profile(username)
    }

    /** Temporary Guillem solution **/
    #[zome_fn("hc_public")]
    fn set_username(username: String) -> ZomeApiResult<Address> {
        username_mod::set_username(username)?;

        Ok(hdk::AGENT_ADDRESS.clone())
    }

    #[zome_fn("hc_public")]
    fn get_all_agents() -> ZomeApiResult<Vec<Username>> {
        profile::handlers::get_all_agents()
    }

    #[zome_fn("hc_public")]
    fn get_username(agent_address: Address) -> ZomeApiResult<Option<String>> {
        profile::handlers::get_username(agent_address)
    }

    #[zome_fn("hc_public")]
    fn get_my_address() -> ZomeApiResult<Address> {
        Ok(hdk::AGENT_ADDRESS.clone())
    }

    #[zome_fn("hc_public")]
    fn get_my_profile() -> ZomeApiResult<Vec<Profile>> {
        profile::handlers::get_my_profile()
    }

    #[zome_fn("hc_public")]
    fn delete_profile(username: String) -> ZomeApiResult<bool> {
        profile::handlers::delete_profile(username)
    }
}
