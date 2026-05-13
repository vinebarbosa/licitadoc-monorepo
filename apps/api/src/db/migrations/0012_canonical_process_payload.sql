ALTER TABLE "processes" ADD COLUMN "procurement_method" text;
ALTER TABLE "processes" ADD COLUMN "bidding_modality" text;
ALTER TABLE "processes" ADD COLUMN "responsible_user_id" text;

CREATE TABLE "process_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "process_id" uuid NOT NULL,
  "position" integer NOT NULL,
  "kind" text NOT NULL,
  "code" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "quantity" numeric,
  "unit" text NOT NULL,
  "unit_value" numeric,
  "total_value" numeric,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "process_item_components" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "item_id" uuid NOT NULL,
  "position" integer NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "quantity" numeric,
  "unit" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "processes" ADD CONSTRAINT "processes_responsible_user_id_users_id_fk"
  FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "process_items" ADD CONSTRAINT "process_items_process_id_processes_id_fk"
  FOREIGN KEY ("process_id") REFERENCES "public"."processes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "process_item_components" ADD CONSTRAINT "process_item_components_item_id_process_items_id_fk"
  FOREIGN KEY ("item_id") REFERENCES "public"."process_items"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "processes_responsible_user_id_idx" ON "processes" USING btree ("responsible_user_id");
CREATE INDEX "process_items_process_id_idx" ON "process_items" USING btree ("process_id");
CREATE UNIQUE INDEX "process_items_process_position_unique" ON "process_items" USING btree ("process_id","position");
CREATE INDEX "process_item_components_item_id_idx" ON "process_item_components" USING btree ("item_id");
CREATE UNIQUE INDEX "process_item_components_item_position_unique" ON "process_item_components" USING btree ("item_id","position");

UPDATE "processes"
SET
  "procurement_method" = NULLIF("type", ''),
  "bidding_modality" = CASE
    WHEN lower("type") IN ('pregao', 'pregão', 'pregao-eletronico', 'pregão eletrônico', 'pregao_eletronico')
      THEN 'reverse_auction'
    ELSE NULL
  END;

CREATE OR REPLACE FUNCTION _licitadoc_decimal_from_text(value text)
RETURNS numeric AS $$
DECLARE
  sanitized text;
  normalized text;
  comma_index integer;
  dot_index integer;
  decimal_index integer;
BEGIN
  IF value IS NULL OR btrim(value) = '' THEN
    RETURN NULL;
  END IF;

  sanitized := regexp_replace(value, '[^0-9,.-]', '', 'g');

  IF sanitized !~ '[0-9]' THEN
    RETURN NULL;
  END IF;

  comma_index := length(sanitized) - strpos(reverse(sanitized), ',') + 1;
  dot_index := length(sanitized) - strpos(reverse(sanitized), '.') + 1;

  IF strpos(reverse(sanitized), ',') = 0 THEN
    comma_index := 0;
  END IF;

  IF strpos(reverse(sanitized), '.') = 0 THEN
    dot_index := 0;
  END IF;

  IF comma_index > dot_index THEN
    decimal_index := comma_index;
  ELSIF dot_index > comma_index THEN
    decimal_index := dot_index;
  ELSE
    decimal_index := 0;
  END IF;

  IF decimal_index > 0 THEN
    normalized :=
      regexp_replace(substr(sanitized, 1, decimal_index - 1), '[,.]', '', 'g') ||
      '.' ||
      regexp_replace(substr(sanitized, decimal_index + 1), '[,.]', '', 'g');
  ELSE
    normalized := regexp_replace(sanitized, '[,.]', '', 'g');
  END IF;

  RETURN NULLIF(normalized, '')::numeric;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

WITH legacy_items AS (
  SELECT
    p."id" AS process_id,
    item.value AS item,
    item.ordinality::integer - 1 AS position
  FROM "processes" p
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(p."source_metadata" #> '{extractedFields,items}') = 'array'
        THEN p."source_metadata" #> '{extractedFields,items}'
      WHEN jsonb_typeof(p."source_metadata" #> '{extractedFields,item}') = 'object'
        THEN jsonb_build_array(p."source_metadata" #> '{extractedFields,item}')
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS item(value, ordinality)
),
inserted_items AS (
  INSERT INTO "process_items" (
    "process_id",
    "position",
    "kind",
    "code",
    "title",
    "description",
    "quantity",
    "unit",
    "unit_value",
    "total_value"
  )
  SELECT
    process_id,
    position,
    CASE WHEN item->>'kind' = 'kit' THEN 'kit' ELSE 'simple' END,
    COALESCE(NULLIF(item->>'code', ''), NULLIF(item->>'itemCode', ''), position::text),
    COALESCE(NULLIF(item->>'title', ''), NULLIF(item->>'description', ''), 'Item ' || (position + 1)::text),
    NULLIF(item->>'description', ''),
    _licitadoc_decimal_from_text(item->>'quantity'),
    COALESCE(NULLIF(item->>'unit', ''), 'un'),
    _licitadoc_decimal_from_text(item->>'unitValue'),
    _licitadoc_decimal_from_text(item->>'totalValue')
  FROM legacy_items
  RETURNING "id", "process_id", "position"
)
INSERT INTO "process_item_components" (
  "item_id",
  "position",
  "title",
  "description",
  "quantity",
  "unit"
)
SELECT
  inserted_items."id",
  component.ordinality::integer - 1,
  COALESCE(NULLIF(component.value->>'title', ''), NULLIF(component.value->>'description', ''), 'Componente ' || component.ordinality::text),
  NULLIF(component.value->>'description', ''),
  _licitadoc_decimal_from_text(component.value->>'quantity'),
  COALESCE(NULLIF(component.value->>'unit', ''), 'un')
FROM inserted_items
JOIN legacy_items ON
  legacy_items.process_id = inserted_items."process_id"
  AND legacy_items.position = inserted_items."position"
CROSS JOIN LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(legacy_items.item->'components') = 'array'
      THEN legacy_items.item->'components'
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS component(value, ordinality);

DROP FUNCTION _licitadoc_decimal_from_text(text);
