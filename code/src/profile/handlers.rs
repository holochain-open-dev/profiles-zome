#![allow(dead_code)]
#![allow(unused_imports)]

use hdk::{
    prelude::*,
    api::AGENT_ADDRESS,
};
use holochain_anchors::anchor;
use crate::profile::{
    Profile,
    Username,
};
use crate::profile::strings::*; 


// HANDLER MODULE UNDER THE PROFILE CRATE

// anchor_username()
// attach anchors to newly created usernames
// anchor format: 
//      anchor type: 'USERNAME_ANCHOR_<first character of username>'
//      anchor text: 'USERNAMES_<first character of username>'
// fn anchor_username(anchor_type: String, anchor_text: String, username: String) -> ZomeApiResult<Address> {
//     let first_letter = username.chars().next().unwrap().to_ascii_lowercase();
//     let type_string = format!("{}{}{}", anchor_type, "_", first_letter);
//     let text_string = format!("{}{}{}", anchor_text, "_", first_letter);
//     anchor(type_string.to_string(), text_string.to_string())
// }

/** Temporary Guillem solution **/

pub fn set_username(username: String) -> ZomeApiResult<()> {
    let new_username = Username::new(username.clone(), AGENT_ADDRESS.clone());

    let username_anchor = holochain_anchors::anchor(USERNAME_ANCHOR_TYPE.into(), USERNAMES_ANCHOR_TEXT.into())?;

    let username_address = hdk::commit_entry(&new_username.entry())?;

    hdk::link_entries(
        &AGENT_ADDRESS,                             // base
        &username_address,                          // target
        AGENT_USERNAME_LINK_TYPE,                   // link_type
        "username"                                  // tag
    )?;

    hdk::link_entries(
        &username_anchor,  
        &username_address,                                       
        USERNAME_LINK_TYPE,                         
        &username.to_ascii_lowercase()                      
    )?;

    Ok(())
}

pub fn create_profile(username: String) -> ZomeApiResult<Profile> {
    let new_username = Username::new(username.clone(), AGENT_ADDRESS.clone());
    let new_profile = Profile::new(new_username.clone());
    let username_entry = new_username.entry();
    let username_address = username_entry.address();

    let links_result = hdk::get_links(
        &AGENT_ADDRESS,
        LinkMatch::Exactly(AGENT_USERNAME_LINK_TYPE),
        LinkMatch::Exactly("username"),
    )?;

    // check if the agent committing the username have committed a username before
    // return error if the agent already has a username.
    if let 0 = links_result.links().len() {
        // check if there is a committed entry with given username
        // If none then commit the profile first to ensure other agent is not committing
        // a username on behalf of other agent then commit the username.
        // If username exist, throw an error
        if let Ok(None) = hdk::get_entry(&username_address) {

            let profile_address = hdk::commit_entry(&new_profile.clone().entry())?;

            hdk::commit_entry(&username_entry.clone())?;

            // Links username to agent's address
            hdk::link_entries(
                &AGENT_ADDRESS,                             // base
                &username_address,                          // target
                AGENT_USERNAME_LINK_TYPE,                   // link_type
                "username"                                  // tag
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
            let username_specific_anchor_text = format!("{}{}{}", USERNAMES_ANCHOR_TEXT.to_string(), "_", &username.to_ascii_lowercase());
            let username_specific_anchor = holochain_anchors::anchor(USERNAME_ANCHOR_TYPE.into(), username_specific_anchor_text.into())?;
            hdk::link_entries(
                &username_specific_anchor,  
                &username_address,                                       
                USERNAME_LINK_TYPE,                         
                &username.to_ascii_lowercase()                      
            )?;

            // links username to profile
            hdk::link_entries(
                &username_address, 
                &profile_address,                                   // profile_address of the entry in the dht
                USERNAME_PROFILE_LINK_TYPE,                         // USERNAME->PROFILE
                "",
            )?;

            // links agent's address to profile
            hdk::link_entries(
                &AGENT_ADDRESS,                                     // base
                &profile_address,                                   // target
                AGENT_PROFILE_LINK_TYPE,                            // link_type
                "profile"                                           // tag
            )?;
            Ok(new_profile)
        } else {
            return Err(ZomeApiError::from(String::from(
                "This username is already existing",
            )))
        }
    } else {
        return Err(ZomeApiError::from(String::from(
            "This agent already has a username",
        )))
    }
}

pub fn get_all_agents() -> ZomeApiResult<Vec<Username>> {
    let username_anchor = holochain_anchors::anchor(USERNAME_ANCHOR_TYPE.into(), USERNAMES_ANCHOR_TEXT.into())?;

    hdk::utils::get_links_and_load_type(
        &username_anchor,
        LinkMatch::Exactly(USERNAME_LINK_TYPE),
        LinkMatch::Any,
    )
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
        }
        _ => Err(ZomeApiError::from(String::from(
            "Agent has more than one username registered",
        ))),
    }
}

// get_profile()
// argument(s): Address
// return value: Profile

pub fn get_profile(agent_address: Address) -> ZomeApiResult<Option<Profile>> {
    let links_result = hdk::get_links(
        &agent_address,
        LinkMatch::Exactly(AGENT_PROFILE_LINK_TYPE),
        LinkMatch::Exactly("profile"),
    )?;

    match links_result.links().len() {
        0 => Ok(None),
        1 => {
            let profile_address = links_result.addresses()[0].clone();

            let profile: Profile = hdk::utils::get_as_type(profile_address)?;
            Ok(Some(profile))
        },
        _ => Err(ZomeApiError::from(String::from(
            "Agent has more than one profile registered",
        ))),
    }
}

pub fn delete_profile(username: String) -> ZomeApiResult<bool> {
    let links_result = hdk::get_links(
        &AGENT_ADDRESS,
        LinkMatch::Exactly(AGENT_USERNAME_LINK_TYPE),
        LinkMatch::Exactly("username"),
    )?;

    if let 1 = links_result.links().len() {

        let username_entry_address = &links_result.addresses()[0];
        let profile_entry_address = &hdk::get_links(
            &AGENT_ADDRESS, 
            LinkMatch::Exactly(AGENT_PROFILE_LINK_TYPE), 
            LinkMatch::Exactly("profile")
        )?.addresses()[0];

        hdk::remove_link(
            &AGENT_ADDRESS,                            
            &username_entry_address,                    
            AGENT_USERNAME_LINK_TYPE,                   
            "username"                                 
        )?;

        let username_anchor = holochain_anchors::anchor(USERNAME_ANCHOR_TYPE.into(), USERNAMES_ANCHOR_TEXT.into())?;
        hdk::remove_link(
            &username_anchor,  
            &username_entry_address,                                       
            USERNAME_LINK_TYPE,                         
            &username.to_ascii_lowercase()                      
        )?;

        let username_specific_anchor_text = format!("{}{}{}", USERNAMES_ANCHOR_TEXT.to_string(), "_", &username.to_ascii_lowercase());
        let username_specific_anchor = holochain_anchors::anchor(USERNAME_ANCHOR_TYPE.into(), username_specific_anchor_text.into())?;
        hdk::remove_link(
            &username_specific_anchor,  
            &username_entry_address,                                       
            USERNAME_LINK_TYPE,                         
            &username.to_ascii_lowercase()                      
        )?;

        hdk::remove_link(
            &username_entry_address, 
            &profile_entry_address,    
            USERNAME_PROFILE_LINK_TYPE,
            "",
        )?;

        hdk::remove_link(
            &AGENT_ADDRESS,  
            &profile_entry_address,  
            AGENT_PROFILE_LINK_TYPE,  
            "profile" 
        )?;

        let _deleted_username_address = hdk::remove_entry(&username_entry_address);
        let _deleted_profile_address = hdk::remove_entry(&profile_entry_address);

        Ok(true)
    } else {
        return Err(ZomeApiError::from(String::from(
            "There is no profile associated with this agent",
        )))
    }
}

// list_public_profiles()
// argument(s): none (can be changed to username)
// return value: Vector of PublicProfile
// pub fn list_public_profiles(username: String) -> ZomeApiResult<Vec<PublicProfile>> {
//     hdk::get_links(
//         &anchor_profile(
//             PUBLIC_PROFILES_ANCHOR_TYPE.to_string(),        // anchor_type: PUBLIC_PROFILE_n
//             PUBLIC_PROFILES_ANCHOR_TEXT.to_string(),        // anchor_text: PUBLIC_PROFILES_n
//             username,
//         )?, 
//         LinkMatch::Exactly(PUBLIC_PROFILE_LINK_TYPE),       // link_type: PUBLIC_PROFILE_LINK
//         LinkMatch::Any                                      // tag: nicko
//     // iterate over the Vec<ZomeApiResult<Entry>> result
//     )?.addresses().into_iter().map(|profile_address| {
//         get_public_profile(profile_address)
//     }).collect()
// }