module.exports = (scenario, conductorConfig) => {
    // Register a scenario, which is a function that gets a special API injected in
    // TATS: this first line is just a boiler plate then sa string you can just specify what scenario you are creating 
  scenario("create_profile", async (s, t) => {
    const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
    const create_profile_result_alice　= await alice.call("profiles", "profiles", "create_profile", {"username":"aLiCeGiRl"})
    const create_profile_result_bob = await bob.call("profiles", "profiles", "create_profile", {"username":"Alexander"})
    await s.consistency()
    // TATS: check if all calls above returns Ok from rust
    await s.consistency()
    t.deepEqual(create_profile_result_bob.Ok.username, "Alexander")
    t.ok(create_profile_result_alice.Ok)
  })

  scenario("validate_create_profile", async (s, t) => {
    const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
    const create_profile_result_alice = await alice.call("profiles", "profiles", "create_profile", {"username":"alice123"})
    await s.consistency()
    // committing the profile entry for the second time for the same agent
    const invalid_create_profile_result_alice = await alice.call("profiles", "profiles", "create_profile", {"username":"alice1234"})
    // committing a non-unique username
    const invalid_create_profile_result_bob = await bob.call("profiles", "profiles", "create_profile", {"username":"alice123"})
    await s.consistency()
    const create_profile_result_bob = await bob.call("profiles", "profiles", "create_profile", {"username":"alice1234"})
    await s.consistency()
    t.ok(create_profile_result_alice.Ok)
    t.deepEqual(invalid_create_profile_result_alice.Err, {"Internal":"This agent already has a username"})
    t.deepEqual(invalid_create_profile_result_bob.Err, {"Internal":"This username is already existing"})
    t.ok(create_profile_result_bob.Ok)
  })

  scenario("get_profile", async (s, t) => {
    const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
    const create_profile_result_alice　= await alice.call("profiles", "profiles", "create_profile", {"username":"alice123"})
    await s.consistency()
    const invalid_create_profile_result_alice = await alice.call("profiles", "profiles", "create_profile", {"username":"alice1234"})
    const invalid_create_profile_result_bob = await bob.call("profiles", "profiles", "create_profile", {"username":"alice123"})
    await s.consistency()
    const get_all_agents_result = await alice.call("profiles", "profiles", "get_all_agents", {})
    const get_my_address_result = await alice.call("profiles", "profiles", "get_my_address", {})
    const get_username_alice_result = await alice.call("profiles", "profiles", "get_username", {"agent_address": get_my_address_result.Ok})
    const get_profile_alice_result = await alice.call("profiles", "profiles", "get_profile", {"agent_address": get_my_address_result.Ok})
    t.deepEqual(get_all_agents_result.Ok.length, 1)
    t.deepEqual(get_username_alice_result.Ok, "alice123")
    t.deepEqual(get_profile_alice_result.Ok, {"agent_id":get_my_address_result.Ok, "username": "alice123"})
  })

  scenario("delete_profile", async (s, t) => {
    const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
    
    // create profiles for alice and bob
    const create_profile_result_alice　= await alice.call("profiles", "profiles", "create_profile", {"username":"AliceInWonderland"})
    const create_profile_result_bob = await bob.call("profiles", "profiles", "create_profile", {"username": "BobMarley"})
    await s.consistency()
    
    // test if profile creation succeeded
    // const get_profile_result_alice = await alice.call("profiles", "profiles", "get_my_profile", {})
    // t.deepEqual(get_profile_result_alice.Ok.length, 1)

    // delete alice's profile
    const delete_profile_result_alice = await alice.call("profiles", "profiles", "delete_profile", {"username": "AliceInWonderland"})
    s.consistency()

    // test return value
    t.deepEqual(delete_profile_result_alice.Ok, true)
    
    // test profile deletion
    const alice_address = await alice.call("profiles", "profiles", "get_my_address", {})
    
    const get_profile_result_alice = await alice.call("profiles", "profiles", "get_profile", {"agent_address": alice_address.Ok})
    t.deepEqual(get_profile_result_alice.Ok, null)
    
    // test username deletion
    const get_username_result_alice = await alice.call("profiles", "profiles", "get_username", {"agent_address": alice_address.Ok})
    t.deepEqual(get_username_result_alice.Ok, null)

    // delete a profile that doesn't exist
    const delete_profile_result_alice_2 = await alice.call("profiles", "profiles", "delete_profile", {"username": "AliceInWonderland"})
    s.consistency()
    t.deepEqual(delete_profile_result_alice_2.Err, {"Internal":"There is no profile associated with this agent"})

  })

  // scenario("list_profiles", async (s, t) => {
  //   const {alice, bob} = await s.players({alice: conductorConfig, bob: conductorConfig}, true)
  //   const create_public_profile_result_alice= await alice.call("kizuna_dna", "profile", "create_public_profile", {"input" : {
  //       "username":"aLiCeGiRl"
  //   }})
  //   const create_public_profile_result_bob = await bob.call("kizuna_dna", "profile", "create_public_profile", {"input" : {
  //       "username":"Alexander"
  //   }})
  //   // TATS: we're testing here the list_profiles fucntion
  //   await s.consistency() 
  //   const list_result_a = await bob.call("kizuna_dna", "profile", "list_public_profiles", {"username": "Alice"})
  //   // check for if the array returned has a length of 2
  //   t.deepEqual(list_result_a.Ok.length, 2)
  // })
}
