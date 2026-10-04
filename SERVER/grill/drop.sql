-- Elimina por completo los datos del grill (exporta antes lo que necesites).
-- docker exec -i notaria_postgres psql -U notaria_user -d notaria_db < SERVER/grill/drop.sql
DROP TABLE IF EXISTS grill_files;
DROP TABLE IF EXISTS grill_answers;
DROP TABLE IF EXISTS grill_sessions;
