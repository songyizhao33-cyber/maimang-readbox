-- Maimang Readbox Public Article Reading Traces
-- Version: 0.1
-- Created: 2026-05-07
--
-- Scope:
-- - expose published article public notes through a safe read-only DTO
-- - expose published article public reflections through a safe read-only DTO
--
-- Explicitly not included in this migration:
-- - any direct table-level public SELECT policy on notes/reflections
-- - external_item note/reflection sharing
-- - any write capability

DROP FUNCTION IF EXISTS public.get_public_article_notes(UUID);
DROP FUNCTION IF EXISTS public.get_public_article_reflections(UUID);

CREATE FUNCTION public.get_public_article_notes(p_article_id UUID)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  article_id UUID,
  selected_text TEXT,
  content TEXT,
  visibility TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    n.id,
    n.item_type,
    n.article_id,
    n.selected_text,
    n.content,
    n.visibility,
    n.created_at,
    n.updated_at
  FROM public.notes AS n
  INNER JOIN public.articles AS a
    ON a.id = n.article_id
  WHERE a.id = p_article_id
    AND a.status = 'published'
    AND n.item_type = 'article'
    AND n.article_id = p_article_id
    AND n.external_item_id IS NULL
    AND n.visibility = 'public'
  ORDER BY n.updated_at DESC;
$$;

CREATE FUNCTION public.get_public_article_reflections(p_article_id UUID)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  article_id UUID,
  content TEXT,
  visibility TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    r.id,
    r.item_type,
    r.article_id,
    r.content,
    r.visibility,
    r.created_at,
    r.updated_at
  FROM public.reflections AS r
  INNER JOIN public.articles AS a
    ON a.id = r.article_id
  WHERE a.id = p_article_id
    AND a.status = 'published'
    AND r.item_type = 'article'
    AND r.article_id = p_article_id
    AND r.external_item_id IS NULL
    AND r.visibility = 'public'
  ORDER BY r.updated_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_public_article_notes(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_article_notes(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_article_notes(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_article_notes(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_article_notes(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.get_public_article_reflections(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_article_reflections(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_article_reflections(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_article_reflections(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_article_reflections(UUID) TO authenticated;
