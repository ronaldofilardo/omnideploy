-- Adicionar coluna temporária
ALTER TABLE "health_events" ADD COLUMN "files_new" JSONB;

-- Atualizar com dados convertidos
UPDATE "health_events" SET "files_new" = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'slot', CASE
          WHEN index = 1 THEN 'request'
          WHEN index = 2 THEN 'authorization'
          WHEN index = 3 THEN 'certificate'
          WHEN index = 4 THEN 'result'
          WHEN index = 5 THEN 'prescription'
          WHEN index = 6 THEN 'invoice'
          ELSE 'unknown'
        END,
        'name', 'Arquivo ' || index,
        'url', value
      )
    ),
    '[]'::jsonb
  )
  FROM unnest("files") WITH ORDINALITY AS t(value, index)
);

-- Dropar coluna antiga e renomear
ALTER TABLE "health_events" DROP COLUMN "files";

ALTER TABLE "health_events" RENAME COLUMN "files_new" TO "files";