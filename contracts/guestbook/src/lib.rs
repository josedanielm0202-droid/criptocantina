#![no_std]
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, String, Vec,
};

/// Una firma en el libro de visitas de la Cripto Cantina.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Firma {
    pub autor: Address,
    pub mensaje: String,
    pub fecha: u64, // timestamp del ledger
}

#[contracttype]
pub enum DataKey {
    Firmas,           // Vec<Firma>
    YaFirmo(Address), // una firma por dirección
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    YaFirmo = 1,
    MensajeVacio = 2,
    MensajeMuyLargo = 3,
}

/// Evento emitido cada vez que alguien firma.
#[contractevent(data_format = "single-value")]
pub struct Firmado {
    #[topic]
    pub autor: Address,
    pub mensaje: String,
}

const MAX_LEN: u32 = 280;
const TTL_UMBRAL: u32 = 17_280 * 7;
const TTL_EXTENDER: u32 = 17_280 * 30;

#[contract]
pub struct Guestbook;

#[contractimpl]
impl Guestbook {
    /// Firma el libro. El autor debe aprobar la transacción con su wallet.
    pub fn firmar(env: Env, autor: Address, mensaje: String) -> Result<u32, Error> {
        autor.require_auth();
        if mensaje.len() == 0 {
            return Err(Error::MensajeVacio);
        }
        if mensaje.len() > MAX_LEN {
            return Err(Error::MensajeMuyLargo);
        }

        let st = env.storage().persistent();
        let clave_autor = DataKey::YaFirmo(autor.clone());
        if st.has(&clave_autor) {
            return Err(Error::YaFirmo);
        }

        let mut firmas: Vec<Firma> = st.get(&DataKey::Firmas).unwrap_or(Vec::new(&env));
        firmas.push_back(Firma {
            autor: autor.clone(),
            mensaje: mensaje.clone(),
            fecha: env.ledger().timestamp(),
        });
        st.set(&DataKey::Firmas, &firmas);
        st.set(&clave_autor, &true);
        st.extend_ttl(&DataKey::Firmas, TTL_UMBRAL, TTL_EXTENDER);
        st.extend_ttl(&clave_autor, TTL_UMBRAL, TTL_EXTENDER);

        Firmado { autor, mensaje }.publish(&env);
        Ok(firmas.len())
    }

    /// Devuelve todas las firmas del libro.
    pub fn listar(env: Env) -> Vec<Firma> {
        env.storage()
            .persistent()
            .get(&DataKey::Firmas)
            .unwrap_or(Vec::new(&env))
    }
}

mod test;