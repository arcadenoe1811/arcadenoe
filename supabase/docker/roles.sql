-- Asigna la clave de POSTGRES_PASSWORD al rol que usa PostgREST.
\set pgpass `echo "$POSTGRES_PASSWORD"`
alter user authenticator with password :'pgpass';
