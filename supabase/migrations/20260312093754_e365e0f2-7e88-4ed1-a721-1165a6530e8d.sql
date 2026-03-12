
-- Adiciona coluna is_test para distinguir conexões reais de conexões de teste.
-- Conexões de teste não precisam de ical_url e geram eventos mockados.
ALTER TABLE public.ota_connections
ADD COLUMN is_test boolean NOT NULL DEFAULT false;

-- Comentário na coluna para documentação
COMMENT ON COLUMN public.ota_connections.is_test IS 'Se true, a conexão é de teste e gera eventos mockados ao sincronizar.';
