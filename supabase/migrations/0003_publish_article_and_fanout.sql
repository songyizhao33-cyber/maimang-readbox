-- Maimang Readbox Publish Article Fan-out RPC
-- Version: 0.1
-- Created: 2026-04-30
--
-- Scope:
-- - publish an author's own draft article
-- - fan out platform inbox_items to current subscribers only
-- - keep inbox delivery idempotent through existing unique indexes
--
-- Explicitly not included in this migration:
-- - inbox list APIs
-- - inbox status updates
-- - external content fan-out
-- - any broadening of ordinary inbox_items RLS policies

DROP FUNCTION IF EXISTS public.publish_article_and_fanout(UUID);

CREATE FUNCTION public.publish_article_and_fanout(p_article_id UUID)
RETURNS TABLE (
  id UUID,
  status TEXT,
  published_at TIMESTAMPTZ,
  inbox_items_created INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_author_id UUID;
  v_published_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT ap.id
  INTO v_author_id
  FROM public.author_profiles AS ap
  WHERE ap.user_id = v_user_id
  LIMIT 1;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'AUTHOR_PROFILE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.articles AS a
  SET
    status = 'published',
    published_at = NOW(),
    updated_at = NOW()
  WHERE a.id = p_article_id
    AND a.author_id = v_author_id
    AND a.status = 'draft'
  RETURNING a.published_at
  INTO v_published_at;

  IF v_published_at IS NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.articles AS a
      WHERE a.id = p_article_id
        AND a.author_id = v_author_id
    ) THEN
      RAISE EXCEPTION 'ARTICLE_NOT_DRAFT' USING ERRCODE = 'P0001';
    END IF;

    RAISE EXCEPTION 'ARTICLE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  WITH inserted AS (
    INSERT INTO public.inbox_items (
      user_id,
      source_type,
      article_id,
      external_item_id,
      status,
      is_starred,
      received_at
    )
    SELECT
      s.reader_id,
      'platform_article',
      p_article_id,
      NULL,
      'unread',
      FALSE,
      NOW()
    FROM public.subscriptions AS s
    WHERE s.author_id = v_author_id
    ON CONFLICT (user_id, article_id)
      WHERE article_id IS NOT NULL
      DO NOTHING
    RETURNING 1
  )
  SELECT
    p_article_id,
    'published',
    v_published_at,
    COUNT(*)::INTEGER
  FROM inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_article_and_fanout(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_article_and_fanout(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.publish_article_and_fanout(UUID) TO authenticated;
