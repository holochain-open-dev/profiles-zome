#![allow(dead_code)]
#![allow(unused_imports)]

use serde_derive::{Deserialize, Serialize};
use holochain_json_derive::DefaultJson;
use hdk::{
    api::AGENT_ADDRESS,
    prelude::*,
};

pub mod handlers;
pub mod strings;
use strings::*;
// MAIN MODULE UNDER THE PROFILE CRATE
// contains data structure definitions and implementations, and entry definitions

// Profile Entry
#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
#[serde(rename_all = "snake_case")]
pub struct Profile {
    pub agent_id: Address,
    pub username: String,
}
// Username Entry
// Used to ensure that there is no duplicate username
#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
#[serde(rename_all = "snake_case")]
pub struct Username {
    pub username: String,
    pub agent_address: Address,
}
#[derive(Serialize, Deserialize, Debug, DefaultJson, Clone)]
#[serde(rename_all = "snake_case")]
pub struct BooleanReturn {
    pub value: bool,
}

// IMPLEMENTATIONS OF STRUCTS
// Profile; new(), entry()
impl Profile {
    // a new() function that will generate a new public profile struct with the given arguments
    pub fn new(username: Username) -> Self {
        Profile {
            agent_id: AGENT_ADDRESS.to_string().into(),
            username: username.username,
        }
    }

    pub fn entry(self) -> Entry {
        Entry::App(PROFILE_ENTRY_NAME.into(), self.into())
    }
}

impl Username {
    pub fn new(username: String, agent_address: Address) -> Self {
        Username {
            username,
            agent_address
        }
    }

    pub fn entry(self) -> Entry {
        Entry::App(USERNAME_ENTRY_NAME.into(), self.into())
    }
}

// DEFINITIONS
// Profile
pub fn profile_definition() -> ValidatingEntryType {
    entry!(
        name: PROFILE_ENTRY_NAME,
        description: "this is the profile spec of the user",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: | validation_data: hdk::EntryValidationData<Profile>| {
            match validation_data {
                hdk::EntryValidationData::Create{entry, validation_data} => {
                    if !validation_data.sources().contains(&entry.agent_id) {
                        return Err("Other agents cannot create a profile for another agent".to_string());
                    }
                    Ok(())
                },
                _ => Ok(())
            }
        },
        links: [
            from!(
                USERNAME_ENTRY_NAME,
                link_type: USERNAME_PROFILE_LINK_TYPE,
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: | _validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            ),
            from!(
                "%agent_id",
                link_type: AGENT_PROFILE_LINK_TYPE,
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: | _validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            )
        ]
    )
}

// Username
pub fn username_definition() -> ValidatingEntryType {
    entry!(
        name: USERNAME_ENTRY_NAME,
        description: "this is the username of the agent",
        sharing: Sharing::Public,
        validation_package: || {
            hdk::ValidationPackageDefinition::Entry
        },
        validation: | _validation_data: hdk::EntryValidationData<Username>| {
            Ok(())
        },
        links: [
            from!(
                holochain_anchors::ANCHOR_TYPE,
                link_type: USERNAME_LINK_TYPE,
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: | _validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            ),
            from!(
                "%agent_id",
                link_type: AGENT_USERNAME_LINK_TYPE,
                validation_package: || {
                    hdk::ValidationPackageDefinition::Entry
                },
                validation: | _validation_data: hdk::LinkValidationData | {
                    Ok(())
                }
            )
        ]
    )
}