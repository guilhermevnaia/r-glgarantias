-- S:\comp-glgarantias\r-glgarantias\backend\fix_table_ownership.sql
-- Este script transfere a propriedade de todas as tabelas e sequências
-- no esquema 'public' para o usuário 'postgres'.
-- Execute este script no seu SQL Editor do Supabase para corrigir erros de permissão
-- ao tentar truncar as tabelas.

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(tbl.tablename) || ' OWNER TO postgres;';
    END LOOP;
END $$
;

DO $$
DECLARE
    seq RECORD;
BEGIN
    FOR seq IN 
        SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(seq.sequence_name) || ' OWNER TO postgres;';
    END LOOP;
END $$
;

-- Mensagem de sucesso
SELECT 'Propriedade de tabelas e sequências atualizada para "postgres" com sucesso!' as message;
