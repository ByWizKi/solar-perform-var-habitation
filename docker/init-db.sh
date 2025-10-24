#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER solaruser CREATEDB;
    GRANT ALL PRIVILEGES ON DATABASE solarperform TO solaruser;
    GRANT ALL PRIVILEGES ON SCHEMA public TO solaruser;
    ALTER SCHEMA public OWNER TO solaruser;
    GRANT CREATE ON SCHEMA public TO solaruser;
EOSQL

