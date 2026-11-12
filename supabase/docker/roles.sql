-- Asigna la clave de POSTGRES_PASSWORD a los roles que usan PostgREST y GoTrue.
\set pgpass `echo "$POSTGRES_PASSWORD"`
alter user authenticator       with password :'pgpass';
alter user supabase_auth_admin with password :'pgpass';
