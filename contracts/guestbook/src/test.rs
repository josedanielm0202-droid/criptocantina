#![cfg(test)]
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events as _},
    Env, Event, String,
};

fn setup() -> (Env, GuestbookClient<'static>) {
    let env = Env::default();
    let id = env.register(Guestbook, ());
    let client = GuestbookClient::new(&env, &id);
    (env, client)
}

#[test]
fn firmar_y_listar() {
    let (env, c) = setup();
    env.mock_all_auths();
    let ana = Address::generate(&env);
    let msg = String::from_str(&env, "¡Salud desde la cantina!");
    assert_eq!(c.firmar(&ana, &msg), 1);
    assert_eq!(env.auths()[0].0, ana);
    assert_eq!(c.listar().get(0).unwrap().mensaje, msg);
}

#[test]
fn publica_evento() {
    let (env, c) = setup();
    env.mock_all_auths();
    let ana = Address::generate(&env);
    let msg = String::from_str(&env, "hola");
    c.firmar(&ana, &msg);
    assert_eq!(
        env.events().all(),
        [Firmado { autor: ana, mensaje: msg }.to_xdr(&env, &c.address)]
    );
}

#[test]
fn no_puede_firmar_dos_veces() {
    let (env, c) = setup();
    env.mock_all_auths();
    let ana = Address::generate(&env);
    c.firmar(&ana, &String::from_str(&env, "uno"));
    assert_eq!(
        c.try_firmar(&ana, &String::from_str(&env, "dos")),
        Err(Ok(Error::YaFirmo))
    );
}

#[test]
fn mensaje_vacio_falla() {
    let (env, c) = setup();
    env.mock_all_auths();
    let ana = Address::generate(&env);
    assert_eq!(
        c.try_firmar(&ana, &String::from_str(&env, "")),
        Err(Ok(Error::MensajeVacio))
    );
}

#[test]
#[should_panic]
fn sin_autorizacion_falla() {
    let (env, c) = setup();
    let ana = Address::generate(&env);
    c.firmar(&ana, &String::from_str(&env, "hola"));
}