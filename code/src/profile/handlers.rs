use hdk::{
    prelude::*,
    api::AGENT_ADDRESS,
    holochain_core_types::time::Timeout,
    holochain_persistence_api::hash::HashString,
};
use holochain_anchors::anchor;

use super::{
    Username,
    Profile,
    strings::*,
    HolochainEntry,
};

pub fn set_username(username: String) -> ZomeApiResult<Profile> {
    let new_username: Username = Username::new(username.clone());
    let username_entry = new_username.entry();
    let username_address = username_entry.address();

    let links_result = hdk::get_links(
        &AGENT_ADDRESS,
        LinkMatch::Exactly(AGENT_USERNAME_LINK_TYPE),
        LinkMatch::Exactly("username"),
    )?;

    // check if the agent committing the username have committed a username before.
    // return error if the agent already has a username.
    if let 0 = links_result.links().len() {
        // check if there is a committed entry with given username
        // If none then commit the username
        // If username exist, throw an error
        if let Ok(None) = hdk::get_entry(&username_address) {

            hdk::commit_entry(&username_entry.clone())?;

            // Links username to agent's address
            hdk::link_entries(
                &AGENT_ADDRESS,
                &username_address,
                AGENT_USERNAME_LINK_TYPE,
                "username"
            )?;

            // links username to general anchor USERNAME_ANCHOR
            let username_anchor = holochain_anchors::anchor(USERNAME_ANCHOR_TYPE.into(), USERNAMES_ANCHOR_TEXT.into())?;
            hdk::link_entries(
                &username_anchor,  
                &username_address,                                       
                USERNAME_LINK_TYPE,                         
                &username.to_ascii_lowercase()                      
            )?;

            // links username to specific anchor USERNAME_ANCHOR_<FIRST_CHARACTER>
            let username_initials_anchor = anchor_username_initials(username.clone())?;
            hdk::link_entries(
                &username_initials_anchor,  
                &username_address,                                       
                USERNAME_LINK_TYPE,                         
                &username.to_ascii_lowercase()                      
            )?;
            let profile = Profile::new(AGENT_ADDRESS.to_owned().into(), username);
            Ok(profile)
        } else {
            // temporary code
            return Err(ZomeApiError::from("{\"code\": \"0\", \"message\": \"This username is already existing\"}".to_owned()))
        }
    } else {
        // temporary code
        return Err(ZomeApiError::from("{\"code\": \"0\", \"message\": \"This agent already has a username\"}".to_owned()))
    }
}

pub fn get_all_agents() -> ZomeApiResult<Vec<Profile>> {
    let username_anchor = holochain_anchors::anchor(USERNAME_ANCHOR_TYPE.into(), USERNAMES_ANCHOR_TEXT.into())?;

    let usernames_with_address = hdk::api::get_links(
        &username_anchor,
        LinkMatch::Exactly(USERNAME_LINK_TYPE),
        LinkMatch::Any,
    )?.addresses()
    .into_iter()
    .filter_map(|username_address| {
        let username_entry_result = hdk::api::get_entry_result(
            &username_address, GetEntryOptions::new(
                StatusRequestKind::default(),
                true,
                true,
                Timeout::default()
            )
        );
        match username_entry_result {
            Ok(u) => {
                if let Some(entry) = u.clone().latest() {
                    match Username::from_entry(&entry) {
                        Some(username) => {
                            match u.result {
                                GetEntryResultType::Single(item) => {
                                    let agent_address = item.headers[0].provenances()[0].source();
                                    let profile = Profile::new(agent_address.into(), username.username);
                                    Some(profile)
                                },
                                GetEntryResultType::All(history) => {
                                    if let Some(item) = history.items.last() {
                                        let agent_address = item.headers[0].provenances()[0].source();
                                        let profile = Profile::new(agent_address.into(), username.username);
                                        Some(profile)
                                    } else {
                                        None
                                    }
                                },
                            }
                        },
                        None => None,
                    }
                } else {
                    None
                }
            },
            Err(_e) => None,
        }
    }).collect();
    Ok(usernames_with_address)
}

pub fn get_username(agent_address: Address) -> ZomeApiResult<Option<String>> {
    let links_result = hdk::get_links(
        &agent_address,
        LinkMatch::Exactly(AGENT_USERNAME_LINK_TYPE),
        LinkMatch::Exactly("username"),
    )?;

    match links_result.links().len() {
        0 => Ok(None),
        1 => {
            let username_address = links_result.addresses()[0].clone();

            let username: Username = hdk::utils::get_as_type(username_address)?;

            Ok(Some(username.username))
        },
        // temporary code
        _ =>  Err(ZomeApiError::from("{\"code\": \"0\", \"message\": \"Agent has more than one username registered\"}".to_owned())),
    }
}

// function for cross zome call from Contacts Zome
pub fn get_address_from_username(username: String) -> ZomeApiResult<Address> {
    
    let username_initials_anchor = anchor_username_initials(username.clone())?;

    let username_entry_address = hdk::get_links(
        &username_initials_anchor,
        LinkMatch::Exactly(USERNAME_LINK_TYPE),
        LinkMatch::Exactly(&username)
    )?.addresses();
    
    match username_entry_address.is_empty() {
        false => {
            let username_entry_result = hdk::api::get_entry_result(
                &username_entry_address[0], GetEntryOptions::new(
                    StatusRequestKind::default(),
                    true,
                    true,
                    Timeout::default()
                ))?;
            match username_entry_result.result {
                GetEntryResultType::Single(item) => {
                    let agent_address = item.headers[0].provenances()[0].source();
                    Ok(agent_address)
                },
                GetEntryResultType::All(history) => {
                    if let Some(item) = history.items.last() {
                        let agent_address = item.headers[0].provenances()[0].source();
                        Ok(agent_address)
                    } else {
                        // temporary code
                        return Err(ZomeApiError::from("{\"code\": \"0\", \"message\": \"Unexpected error occured\"}".to_owned()))
                    }
                }
            }
        },
        // temporary code
        true => return Err(ZomeApiError::from("{\"code\": \"0\", \"message\": \"No user with that username exists\"}".to_owned()))
    }
}

// HELPER FUNCTION

// create anchor for initials
fn anchor_username_initials(username: String) -> ZomeApiResult<Address> {
    let first_letter;
    if let Some(c) = username.chars().next() {
        first_letter = c.to_ascii_lowercase();
    } else {
        return Err(ZomeApiError::from("{\"code\": \"0\", \"message\": \"There was no username passed as an argument\"}".to_owned()))
    }
    let text_string = format!("{}{}{}", USERNAMES_ANCHOR_TEXT, "_", first_letter);
    anchor(USERNAME_ANCHOR_TYPE.to_owned(), text_string.to_owned())
}

// pub fn update_username(username: String) -> ZomeApiResult<bool> {
//     let link_result = hdk::get_links(
//         &AGENT_ADDRESS,
//         LinkMatch::Exactly(AGENT_USERNAME_LINK_TYPE),
//         LinkMatch::Exactly("username"),
//     )?;

//     let new_username = Username::new(username.clone());
//     let username_entry = new_username.entry();

//     if let 1 = links_result.links().len() {
//         if let Ok(None) = hdk::get_entry(&username_entry.address()) {
//             let username_address = link_result.addresses()[0].clone();
    
//             let mut username: Username = hdk::utils::get_as_type(username_address)?;
    
//             username.username = profile.username.clone();

//             hdk::update_entry(username.entry(), &link_result.addresses()[0])?;
    
//             Ok(true)
//         } else {    
//             return Err(ZomeApiError::from(String::from(
//                 "This username is already existing",
//             )))
//         }
//     } else {
//         return Err(ZomeApiError::from(String::from(
//             "There is no username associated with this agent",
//         )))
//     }
// }

// pub fn delete_my_username() -> ZomeApiResult<bool> {
//     let links_result = hdk::get_links(
//         &AGENT_ADDRESS,
//         LinkMatch::Exactly(AGENT_USERNAME_LINK_TYPE),
//         LinkMatch::Exactly("username"),
//     )?;

//     if let 1 = links_result.links().len() {

//         let username_entry_address = &links_result.addresses()[0];
//         let username_entry: Username = hdk::utils::get_as_type(username_entry_address.clone())?; 

//         hdk::remove_link(
//             &AGENT_ADDRESS,                            
//             &username_entry_address,                    
//             AGENT_USERNAME_LINK_TYPE,                   
//             "username"                                 
//         )?;

//         let username_anchor = holochain_anchors::anchor(USERNAME_ANCHOR_TYPE.into(), USERNAMES_ANCHOR_TEXT.into())?;
//         hdk::remove_link(
//             &username_anchor,  
//             &username_entry_address,                                       
//             USERNAME_LINK_TYPE,                         
//             &username_entry.username.to_ascii_lowercase()                      
//         )?;

//         let username_initials_anchor = anchor_username_initials(username_entry.username.clone())?;
//         hdk::remove_link(
//             &username_initials_anchor,  
//             &username_entry_address,                                       
//             USERNAME_LINK_TYPE,                         
//             &username_entry.username.to_ascii_lowercase()                      
//         )?;

//         hdk::remove_entry(&username_entry_address)?;

//         Ok(true)
//     } else {
//         return Err(ZomeApiError::from(String::from(
//             "There is no username associated with this agent",
//         )))
//     }
// }