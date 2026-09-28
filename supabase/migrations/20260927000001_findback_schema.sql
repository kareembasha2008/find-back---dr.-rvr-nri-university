-- ====================================================================
-- FIND BACK - Dr. RVR NRI University, Agiripalli
-- Full Database Schema, Security (RLS), Triggers, Functions & Storage
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- --------------------------------------------------------------------
-- 1. PROFILES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  university_email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  department TEXT NOT NULL DEFAULT 'CSE',
  year TEXT NOT NULL DEFAULT '1st Year',
  section TEXT NOT NULL DEFAULT 'A',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  profile_photo_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  profile_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(university_email);

-- --------------------------------------------------------------------
-- 2. ADMIN PROFILES TABLE (Server-side admin registry)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles WHERE id = auth.uid()
  );
$$;

-- --------------------------------------------------------------------
-- 3. ITEMS TABLE (Lost & Found reports)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  approx_time TEXT NOT NULL DEFAULT '11:00 AM',
  description TEXT NOT NULL,
  photo_url TEXT,
  private_verification_question TEXT,
  private_verification_answer TEXT,
  status TEXT NOT NULL DEFAULT 'Searching' CHECK (status IN ('Searching', 'Possible Match', 'Verification Required', 'Resolved')),
  resolution_note TEXT,
  reporter_dept TEXT,
  reporter_year TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_type ON public.items(type);
CREATE INDEX IF NOT EXISTS idx_items_category ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_location ON public.items(location);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON public.items(created_at DESC);

-- --------------------------------------------------------------------
-- 4. MATCHES TABLE (Smart matching pairs)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  found_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'under_verification', 'verified', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_match_pair UNIQUE (lost_item_id, found_item_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_lost_item ON public.matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_found_item ON public.matches(found_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);

-- --------------------------------------------------------------------
-- 5. CLAIMS TABLE (Ownership verification & safe exchange)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  lost_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  found_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  claimant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_answer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  safe_exchange_location TEXT NOT NULL DEFAULT 'Central Library Helpdesk (Ground Floor)',
  contact_requested BOOLEAN NOT NULL DEFAULT true,
  contact_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_claimant ON public.claims(claimant_user_id);
CREATE INDEX IF NOT EXISTS idx_claims_found_item ON public.claims(found_item_id);

-- --------------------------------------------------------------------
-- 6. NOTIFICATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('report_created', 'possible_match', 'verification_required', 'item_resolved', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- --------------------------------------------------------------------
-- 7. ITEM REPORTS TABLE (Abuse / spam reporting)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.item_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('Fake listing', 'Spam', 'Wrong information', 'Inappropriate content', 'Other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_item_reports_item_id ON public.item_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_status ON public.item_reports(status);

-- --------------------------------------------------------------------
-- 8. AUDIT LOGS TABLE (Admin actions)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);

-- --------------------------------------------------------------------
-- 9. UPDATED_AT TRIGGER FUNCTION
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_items_updated_at ON public.items;
CREATE TRIGGER trigger_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_matches_updated_at ON public.matches;
CREATE TRIGGER trigger_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_claims_updated_at ON public.claims;
CREATE TRIGGER trigger_claims_updated_at
  BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON public.notifications;
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_item_reports_updated_at ON public.item_reports;
CREATE TRIGGER trigger_item_reports_updated_at
  BEFORE UPDATE ON public.item_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------
-- 10. AUTH TRIGGER: Auto-create profile on Auth signup
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT;
  v_student_id TEXT;
  v_dept TEXT;
  v_year TEXT;
  v_section TEXT;
  v_phone TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_student_id := COALESCE(NEW.raw_user_meta_data->>'student_id', 'STU_' || substr(NEW.id::text, 1, 8));
  v_dept := COALESCE(NEW.raw_user_meta_data->>'department', 'CSE');
  v_year := COALESCE(NEW.raw_user_meta_data->>'year', '1st Year');
  v_section := COALESCE(NEW.raw_user_meta_data->>'section', 'A');
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone_number', '');

  INSERT INTO public.profiles (
    id,
    full_name,
    student_id,
    university_email,
    phone_number,
    department,
    year,
    section,
    role,
    onboarding_completed,
    profile_confirmed
  ) VALUES (
    NEW.id,
    v_full_name,
    v_student_id,
    NEW.email,
    v_phone,
    v_dept,
    v_year,
    v_section,
    'student',
    false,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    student_id = EXCLUDED.student_id,
    university_email = EXCLUDED.university_email,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- 11. PRIVACY-SAFE ITEMS VIEW (Never leaks private verification answer)
-- --------------------------------------------------------------------
CREATE OR REPLACE VIEW public.safe_items AS
SELECT
  id,
  user_id,
  type,
  name,
  category,
  location,
  date,
  approx_time,
  description,
  photo_url,
  private_verification_question,
  -- Private answer only revealed to creator or admin
  CASE
    WHEN auth.uid() = user_id OR public.is_admin() THEN private_verification_answer
    ELSE NULL
  END AS private_verification_answer,
  status,
  resolution_note,
  reporter_dept,
  reporter_year,
  created_at,
  updated_at
FROM public.items;

-- --------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 12.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 12.2 ADMIN PROFILES POLICIES
DROP POLICY IF EXISTS "Admins can view admin profiles" ON public.admin_profiles;
CREATE POLICY "Admins can view admin profiles"
  ON public.admin_profiles FOR SELECT
  USING (public.is_admin() OR auth.uid() = id);

-- 12.3 ITEMS POLICIES
DROP POLICY IF EXISTS "Authenticated users can view items" ON public.items;
CREATE POLICY "Authenticated users can view items"
  ON public.items FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own items" ON public.items;
CREATE POLICY "Users can insert their own items"
  ON public.items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own items" ON public.items;
CREATE POLICY "Users can update own items"
  ON public.items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own items" ON public.items;
CREATE POLICY "Users can delete own items"
  ON public.items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- 12.4 MATCHES POLICIES
DROP POLICY IF EXISTS "Users view related matches" ON public.matches;
CREATE POLICY "Users view related matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id IN (matches.lost_item_id, matches.found_item_id)
        AND items.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System and users can insert matches" ON public.matches;
CREATE POLICY "System and users can insert matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own matches" ON public.matches;
CREATE POLICY "Users can update their own matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id IN (matches.lost_item_id, matches.found_item_id)
        AND items.user_id = auth.uid()
    )
  );

-- 12.5 CLAIMS POLICIES
DROP POLICY IF EXISTS "Involved parties can view claim" ON public.claims;
CREATE POLICY "Involved parties can view claim"
  ON public.claims FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    claimant_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = claims.found_item_id AND items.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert claims" ON public.claims;
CREATE POLICY "Users can insert claims"
  ON public.claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = claimant_user_id);

DROP POLICY IF EXISTS "Involved parties can update claims" ON public.claims;
CREATE POLICY "Involved parties can update claims"
  ON public.claims FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR
    claimant_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = claims.found_item_id AND items.user_id = auth.uid()
    )
  );

-- 12.6 NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 12.7 ITEM REPORTS POLICIES
DROP POLICY IF EXISTS "Users can submit reports" ON public.item_reports;
CREATE POLICY "Users can submit reports"
  ON public.item_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view and manage reports" ON public.item_reports;
CREATE POLICY "Admins can view and manage reports"
  ON public.item_reports FOR ALL
  TO authenticated
  USING (public.is_admin() OR reporter_id = auth.uid());

-- 12.8 AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 13. SMART MATCHING BACKEND FUNCTION
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_match_score(
  p_lost_id UUID,
  p_found_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lost RECORD;
  v_found RECORD;
  v_cat_pts INT := 0;
  v_name_pts INT := 0;
  v_loc_pts INT := 0;
  v_time_pts INT := 0;
  v_desc_pts INT := 0;
  v_total_score INT := 0;
  v_day_diff NUMERIC;
BEGIN
  SELECT * INTO v_lost FROM public.items WHERE id = p_lost_id;
  SELECT * INTO v_found FROM public.items WHERE id = p_found_id;

  IF v_lost IS NULL OR v_found IS NULL THEN
    RETURN jsonb_build_object('score', 0, 'breakdown', '{}'::jsonb);
  END IF;

  -- 1. Category (20 pts)
  IF v_lost.category = v_found.category THEN
    v_cat_pts := 20;
  END IF;

  -- 2. Similar Title / Name (25 pts)
  IF lower(trim(v_lost.name)) = lower(trim(v_found.name)) THEN
    v_name_pts := 25;
  ELSIF position(lower(trim(v_lost.name)) in lower(trim(v_found.name))) > 0 OR
        position(lower(trim(v_found.name)) in lower(trim(v_lost.name))) > 0 THEN
    v_name_pts := 20;
  ELSE
    -- Partial keyword match
    v_name_pts := 8;
  END IF;

  -- 3. Same Location (25 pts)
  IF v_lost.location = v_found.location THEN
    v_loc_pts := 25;
  ELSIF (v_lost.location LIKE '%Block%' AND v_found.location LIKE '%Block%') THEN
    v_loc_pts := 10;
  END IF;

  -- 4. Similar Date & Time (15 pts)
  v_day_diff := abs(v_lost.date - v_found.date);
  IF v_day_diff <= 1 THEN
    v_time_pts := v_time_pts + 10;
  ELSIF v_day_diff <= 3 THEN
    v_time_pts := v_time_pts + 6;
  ELSIF v_day_diff <= 7 THEN
    v_time_pts := v_time_pts + 3;
  END IF;

  IF lower(trim(v_lost.approx_time)) = lower(trim(v_found.approx_time)) THEN
    v_time_pts := v_time_pts + 5;
  ELSIF (v_lost.approx_time LIKE '%AM%' AND v_found.approx_time LIKE '%AM%') OR
        (v_lost.approx_time LIKE '%PM%' AND v_found.approx_time LIKE '%PM%') THEN
    v_time_pts := v_time_pts + 3;
  END IF;
  IF v_time_pts > 15 THEN v_time_pts := 15; END IF;

  -- 5. Similar Description (15 pts)
  IF lower(trim(v_lost.description)) = lower(trim(v_found.description)) THEN
    v_desc_pts := 15;
  ELSIF length(v_lost.description) > 5 AND length(v_found.description) > 5 THEN
    v_desc_pts := 8;
  END IF;

  v_total_score := v_cat_pts + v_name_pts + v_loc_pts + v_time_pts + v_desc_pts;
  IF v_total_score > 100 THEN v_total_score := 100; END IF;

  RETURN jsonb_build_object(
    'score', v_total_score,
    'breakdown', jsonb_build_object(
      'category', v_cat_pts,
      'name', v_name_pts,
      'location', v_loc_pts,
      'time', v_time_pts,
      'description', v_desc_pts
    )
  );
END;
$$;

-- --------------------------------------------------------------------
-- 14. MATCHING RUNNER FUNCTION (Called on new item creation)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.run_smart_matching_for_item(
  p_item_id UUID,
  p_threshold INT DEFAULT 60
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_opp RECORD;
  v_calc JSONB;
  v_score INT;
  v_breakdown JSONB;
  v_lost_id UUID;
  v_found_id UUID;
  v_match_count INT := 0;
  v_match_id UUID;
BEGIN
  SELECT * INTO v_item FROM public.items WHERE id = p_item_id;
  IF v_item IS NULL THEN RETURN 0; END IF;

  FOR v_opp IN
    SELECT * FROM public.items
    WHERE type != v_item.type
      AND status != 'Resolved'
      AND user_id != v_item.user_id
      AND category = v_item.category
  LOOP
    IF v_item.type = 'lost' THEN
      v_lost_id := v_item.id;
      v_found_id := v_opp.id;
    ELSE
      v_lost_id := v_opp.id;
      v_found_id := v_item.id;
    END IF;

    v_calc := public.calculate_match_score(v_lost_id, v_found_id);
    v_score := (v_calc->>'score')::INT;
    v_breakdown := v_calc->'breakdown';

    IF v_score >= p_threshold THEN
      -- Insert match if not already existing
      INSERT INTO public.matches (
        lost_item_id,
        found_item_id,
        score,
        breakdown,
        status
      ) VALUES (
        v_lost_id,
        v_found_id,
        v_score,
        v_breakdown,
        'suggested'
      )
      ON CONFLICT (lost_item_id, found_item_id) DO NOTHING
      RETURNING id INTO v_match_id;

      IF v_match_id IS NOT NULL THEN
        v_match_count := v_match_count + 1;

        -- Update item status to 'Possible Match'
        UPDATE public.items SET status = 'Possible Match' WHERE id IN (v_lost_id, v_found_id) AND status = 'Searching';

        -- Notify lost item owner
        INSERT INTO public.notifications (
          user_id,
          type,
          title,
          message,
          item_id,
          match_id
        ) VALUES (
          (SELECT user_id FROM public.items WHERE id = v_lost_id),
          'possible_match',
          'Possible Match Detected',
          'A reported found item matches your lost item with ' || v_score || '% match score.',
          v_lost_id,
          v_match_id
        );

        -- Notify found item reporter
        INSERT INTO public.notifications (
          user_id,
          type,
          title,
          message,
          item_id,
          match_id
        ) VALUES (
          (SELECT user_id FROM public.items WHERE id = v_found_id),
          'possible_match',
          'Possible Match Found',
          'Your reported found item matches a lost item report with ' || v_score || '% match score.',
          v_found_id,
          v_match_id
        );
      END IF;
    END IF;
  END LOOP;

  RETURN v_match_count;
END;
$$;

-- --------------------------------------------------------------------
-- 15. STORAGE BUCKET CREATION & POLICIES
-- --------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
DROP POLICY IF EXISTS "Public read item images" ON storage.objects;
CREATE POLICY "Public read item images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-images');

DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;
CREATE POLICY "Authenticated users can upload item images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'item-images');

DROP POLICY IF EXISTS "Users can update own item images" ON storage.objects;
CREATE POLICY "Users can update own item images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[2]);

DROP POLICY IF EXISTS "Users can delete own item images" ON storage.objects;
CREATE POLICY "Users can delete own item images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Enable Realtime safely without throwing if already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'claims'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
  END IF;
END $$;
