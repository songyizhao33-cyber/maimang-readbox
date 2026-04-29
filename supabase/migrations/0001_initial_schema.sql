-- Maimang Readbox Initial Schema
-- Version: 0.2
-- Created: 2026-04-29
--
-- Scope:
-- - 11 core tables
-- - conservative indexes and constraints
-- - baseline row level security
--
-- Explicitly not included in this migration:
-- - auth registration/login flows
-- - profile auto-create triggers
-- - permissive admin-wide policies

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Table: profiles
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('reader', 'author', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);

-- TODO(T10): decide whether profiles are created by a DB trigger or auth flow.

-- ============================================================================
-- Table: author_profiles
-- ============================================================================

CREATE TABLE public.author_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  pen_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  homepage_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_author_profiles_is_active ON public.author_profiles(is_active);

-- ============================================================================
-- Table: articles
-- ============================================================================

CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.author_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'removed')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT articles_published_requires_timestamp CHECK (
    status <> 'published' OR published_at IS NOT NULL
  )
);

CREATE INDEX idx_articles_author_id ON public.articles(author_id);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_published_at ON public.articles(published_at DESC);

-- ============================================================================
-- Table: subscriptions
-- ============================================================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.author_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_reader_author_unique UNIQUE (reader_id, author_id)
);

CREATE INDEX idx_subscriptions_reader_id ON public.subscriptions(reader_id);
CREATE INDEX idx_subscriptions_author_id ON public.subscriptions(author_id);

-- ============================================================================
-- Table: external_items
-- ============================================================================

CREATE TABLE public.external_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT,
  title TEXT NOT NULL,
  source_platform TEXT,
  source_author TEXT,
  excerpt TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('link', 'text', 'image', 'pdf')),
  original_content TEXT,
  extracted_content TEXT,
  legal_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_external_items_user_id ON public.external_items(user_id);
CREATE INDEX idx_external_items_content_type ON public.external_items(content_type);
CREATE INDEX idx_external_items_created_at ON public.external_items(created_at DESC);

-- ============================================================================
-- Table: inbox_items
-- ============================================================================

CREATE TABLE public.inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('platform_article', 'external_link')),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  external_item_id UUID REFERENCES public.external_items(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'reading', 'read', 'archived')),
  is_starred BOOLEAN NOT NULL DEFAULT FALSE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inbox_items_source_reference_check CHECK (
    (source_type = 'platform_article' AND article_id IS NOT NULL AND external_item_id IS NULL)
    OR
    (source_type = 'external_link' AND article_id IS NULL AND external_item_id IS NOT NULL)
  )
);

CREATE INDEX idx_inbox_items_user_status ON public.inbox_items(user_id, status);
CREATE INDEX idx_inbox_items_user_starred ON public.inbox_items(user_id, is_starred);
CREATE INDEX idx_inbox_items_received_at ON public.inbox_items(received_at DESC);
CREATE UNIQUE INDEX idx_inbox_items_user_article_unique
  ON public.inbox_items(user_id, article_id)
  WHERE article_id IS NOT NULL;
CREATE UNIQUE INDEX idx_inbox_items_user_external_item_unique
  ON public.inbox_items(user_id, external_item_id)
  WHERE external_item_id IS NOT NULL;

-- ============================================================================
-- Table: collections
-- ============================================================================

CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE UNIQUE INDEX idx_collections_user_name_unique ON public.collections(user_id, name);

-- ============================================================================
-- Table: collection_items
-- ============================================================================

CREATE TABLE public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('article', 'external_item')),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  external_item_id UUID REFERENCES public.external_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT collection_items_reference_check CHECK (
    (item_type = 'article' AND article_id IS NOT NULL AND external_item_id IS NULL)
    OR
    (item_type = 'external_item' AND article_id IS NULL AND external_item_id IS NOT NULL)
  )
);

CREATE INDEX idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE UNIQUE INDEX idx_collection_items_collection_article_unique
  ON public.collection_items(collection_id, article_id)
  WHERE article_id IS NOT NULL;
CREATE UNIQUE INDEX idx_collection_items_collection_external_unique
  ON public.collection_items(collection_id, external_item_id)
  WHERE external_item_id IS NOT NULL;

-- ============================================================================
-- Table: notes
-- ============================================================================

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('article', 'external_item')),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  external_item_id UUID REFERENCES public.external_items(id) ON DELETE CASCADE,
  selected_text TEXT,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notes_reference_check CHECK (
    (item_type = 'article' AND article_id IS NOT NULL AND external_item_id IS NULL)
    OR
    (item_type = 'external_item' AND article_id IS NULL AND external_item_id IS NOT NULL)
  )
);

CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_article_id ON public.notes(article_id);
CREATE INDEX idx_notes_external_item_id ON public.notes(external_item_id);
CREATE INDEX idx_notes_visibility ON public.notes(visibility);

-- ============================================================================
-- Table: reflections
-- ============================================================================

CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('article', 'external_item')),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  external_item_id UUID REFERENCES public.external_items(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reflections_reference_check CHECK (
    (item_type = 'article' AND article_id IS NOT NULL AND external_item_id IS NULL)
    OR
    (item_type = 'external_item' AND article_id IS NULL AND external_item_id IS NOT NULL)
  )
);

CREATE INDEX idx_reflections_user_id ON public.reflections(user_id);
CREATE INDEX idx_reflections_article_id ON public.reflections(article_id);
CREATE INDEX idx_reflections_external_item_id ON public.reflections(external_item_id);
CREATE INDEX idx_reflections_visibility ON public.reflections(visibility);

-- ============================================================================
-- Table: moderation_reports
-- ============================================================================

CREATE TABLE public.moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('article', 'reflection', 'note')),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  reflection_id UUID REFERENCES public.reflections(id) ON DELETE CASCADE,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT moderation_reports_target_reference_check CHECK (
    (target_type = 'article' AND article_id IS NOT NULL AND reflection_id IS NULL AND note_id IS NULL)
    OR
    (target_type = 'reflection' AND article_id IS NULL AND reflection_id IS NOT NULL AND note_id IS NULL)
    OR
    (target_type = 'note' AND article_id IS NULL AND reflection_id IS NULL AND note_id IS NOT NULL)
  )
);

CREATE INDEX idx_moderation_reports_reporter_id ON public.moderation_reports(reporter_id);
CREATE INDEX idx_moderation_reports_status ON public.moderation_reports(status);
CREATE INDEX idx_moderation_reports_created_at ON public.moderation_reports(created_at DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- author_profiles
CREATE POLICY "Anyone can view active author profiles"
  ON public.author_profiles
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Users can view own author profile"
  ON public.author_profiles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own author profile"
  ON public.author_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own author profile"
  ON public.author_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own author profile"
  ON public.author_profiles
  FOR DELETE
  USING (user_id = auth.uid());

-- articles
CREATE POLICY "Anyone can view published articles"
  ON public.articles
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Authors can view own articles"
  ON public.articles
  FOR SELECT
  USING (
    author_id IN (
      SELECT ap.id
      FROM public.author_profiles ap
      WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can insert own articles"
  ON public.articles
  FOR INSERT
  WITH CHECK (
    author_id IN (
      SELECT ap.id
      FROM public.author_profiles ap
      WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update own articles"
  ON public.articles
  FOR UPDATE
  USING (
    author_id IN (
      SELECT ap.id
      FROM public.author_profiles ap
      WHERE ap.user_id = auth.uid()
    )
  )
  WITH CHECK (
    author_id IN (
      SELECT ap.id
      FROM public.author_profiles ap
      WHERE ap.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete own articles"
  ON public.articles
  FOR DELETE
  USING (
    author_id IN (
      SELECT ap.id
      FROM public.author_profiles ap
      WHERE ap.user_id = auth.uid()
    )
  );

-- subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (reader_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (reader_id = auth.uid());

CREATE POLICY "Users can delete own subscriptions"
  ON public.subscriptions
  FOR DELETE
  USING (reader_id = auth.uid());

-- external_items
CREATE POLICY "Users can view own external items"
  ON public.external_items
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own external items"
  ON public.external_items
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own external items"
  ON public.external_items
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own external items"
  ON public.external_items
  FOR DELETE
  USING (user_id = auth.uid());

-- inbox_items
CREATE POLICY "Users can view own inbox items"
  ON public.inbox_items
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own inbox items"
  ON public.inbox_items
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own inbox items"
  ON public.inbox_items
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own inbox items"
  ON public.inbox_items
  FOR DELETE
  USING (user_id = auth.uid());

-- collections
CREATE POLICY "Users can view own collections"
  ON public.collections
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own collections"
  ON public.collections
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own collections"
  ON public.collections
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own collections"
  ON public.collections
  FOR DELETE
  USING (user_id = auth.uid());

-- collection_items
CREATE POLICY "Users can view own collection items"
  ON public.collection_items
  FOR SELECT
  USING (
    collection_id IN (
      SELECT c.id
      FROM public.collections c
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own collection items"
  ON public.collection_items
  FOR INSERT
  WITH CHECK (
    collection_id IN (
      SELECT c.id
      FROM public.collections c
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own collection items"
  ON public.collection_items
  FOR UPDATE
  USING (
    collection_id IN (
      SELECT c.id
      FROM public.collections c
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    collection_id IN (
      SELECT c.id
      FROM public.collections c
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own collection items"
  ON public.collection_items
  FOR DELETE
  USING (
    collection_id IN (
      SELECT c.id
      FROM public.collections c
      WHERE c.user_id = auth.uid()
    )
  );

-- notes
CREATE POLICY "Users can view own notes"
  ON public.notes
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notes"
  ON public.notes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notes"
  ON public.notes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notes"
  ON public.notes
  FOR DELETE
  USING (user_id = auth.uid());

-- TODO(T43): add explicit public-note read rules only after note sharing is specified.

-- reflections
CREATE POLICY "Users can view own reflections"
  ON public.reflections
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reflections"
  ON public.reflections
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reflections"
  ON public.reflections
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reflections"
  ON public.reflections
  FOR DELETE
  USING (user_id = auth.uid());

-- TODO(T44/T45): add public reflection visibility rules after sharing behavior is finalized.

-- moderation_reports
CREATE POLICY "Users can view own moderation reports"
  ON public.moderation_reports
  FOR SELECT
  USING (reporter_id = auth.uid());

CREATE POLICY "Authenticated users can create moderation reports"
  ON public.moderation_reports
  FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

-- TODO(T50-T52): add explicit admin moderation policies after admin workflows are implemented.
