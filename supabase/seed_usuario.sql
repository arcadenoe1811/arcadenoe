-- Primer usuario del sistema. SOLO PARA DESARROLLO LOCAL.
--   correo:     admin@inventario.local
--   contrasena: admin1234   <- cambiala al entrar (clic en tu nombre)
--
-- Al ser el primer usuario, el trigger usuarios_crear_perfil (migracion
-- 00011) lo registra como admin. Los demas usuarios se crean desde la app
-- (pantalla Usuarios).
--
-- Se separa de seed.sql porque necesita las tablas de Supabase Auth, que
-- crea GoTrue al arrancar. La CLI lo carga automaticamente (config.toml);
-- el docker-compose lo carga con el servicio "semilla-usuario".
--
-- Notas:
-- * Los campos *_token y email_change deben ser '' y no NULL: GoTrue falla
--   al iniciar sesion si estan en NULL.
-- * signInWithPassword necesita tambien la fila en auth.identities.
-- * Id fijo para que el script sea idempotente.

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@inventario.local',
  extensions.crypt('admin1234', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"nombre":"Administrador"}',
  'authenticated',
  'authenticated',
  '', '', '', ''
) on conflict do nothing;

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'email',
  '{"sub":"00000000-0000-4000-8000-000000000001","email":"admin@inventario.local","email_verified":true}',
  now(), now(), now()
) on conflict do nothing;
