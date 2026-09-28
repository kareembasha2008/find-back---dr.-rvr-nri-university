-- ====================================================================
-- FIND BACK - Production Multi-User Lost & Found Platform Migration
-- Dr. RVR NRI University, Agiripalli
-- ====================================================================

-- 1. ADD COLUMNS TO ITEMS FOR GOOGLE MAPS COORDINATES
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS building_name TEXT;

-- 2. ENSURE PROFILES CONSTRAINTS (One Account Per Person)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_profiles_phone_number;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS unique_phone_number;
ALTER TABLE public.profiles ADD CONSTRAINT unique_profiles_phone_number UNIQUE (phone_number);

-- 3. NORMALIZATION TRIGGER ON PROFILES
CREATE OR REPLACE FUNCTION public.normalize_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  NEW.university_email := lower(trim(NEW.university_email));
  NEW.student_id := upper(trim(NEW.student_id));
  IF NEW.phone_number IS NOT NULL THEN
    NEW.phone_number := trim(NEW.phone_number);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_normalize_profiles ON public.profiles;
CREATE TRIGGER trigger_normalize_profiles
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_profile_data();

-- 4. RECREATE SAFE_ITEMS VIEW WITH MAP COORDINATES
DROP VIEW IF EXISTS public.safe_items CASCADE;
CREATE VIEW public.safe_items AS
SELECT
  id,
  user_id,
  type,
  name,
  category,
  location,
  building_name,
  latitude,
  longitude,
  date,
  approx_time,
  description,
  photo_url,
  private_verification_question,
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

-- 5. CONTACT_REQUESTS TABLE FOR SECURE CONTACT WORKFLOW
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  message TEXT,
  response_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_requester ON public.contact_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_owner ON public.contact_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_item ON public.contact_requests(item_id);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parties can view contact request" ON public.contact_requests;
CREATE POLICY "Parties can view contact request"
  ON public.contact_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requester_id OR
    auth.uid() = owner_id OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Requesters can create contact request" ON public.contact_requests;
CREATE POLICY "Requesters can create contact request"
  ON public.contact_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Owners and admins can update contact request" ON public.contact_requests;
CREATE POLICY "Owners and admins can update contact request"
  ON public.contact_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id OR public.is_admin())
  WITH CHECK (auth.uid() = owner_id OR public.is_admin());

-- 6. RPC: GET PERMITTED CONTACT INFO AFTER VERIFICATION
CREATE OR REPLACE FUNCTION public.get_permitted_contact(p_contact_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req RECORD;
  v_owner RECORD;
  v_requester RECORD;
BEGIN
  SELECT * INTO v_req FROM public.contact_requests WHERE id = p_contact_request_id;
  IF v_req IS NULL THEN
    RETURN jsonb_build_object('error', 'Contact request not found');
  END IF;

  IF auth.uid() != v_req.requester_id AND auth.uid() != v_req.owner_id AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  IF v_req.status != 'ACCEPTED' AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('error', 'Contact request is not accepted yet');
  END IF;

  SELECT full_name, university_email, phone_number, department, year INTO v_owner
  FROM public.profiles WHERE id = v_req.owner_id;

  SELECT full_name, university_email, phone_number, department, year INTO v_requester
  FROM public.profiles WHERE id = v_req.requester_id;

  RETURN jsonb_build_object(
    'status', v_req.status,
    'owner', jsonb_build_object(
      'full_name', v_owner.full_name,
      'university_email', v_owner.university_email,
      'phone_number', v_owner.phone_number,
      'department', v_owner.department
    ),
    'requester', jsonb_build_object(
      'full_name', v_requester.full_name,
      'university_email', v_requester.university_email,
      'phone_number', v_requester.phone_number,
      'department', v_requester.department
    )
  );
END;
$$;

-- 7. STORAGE BUCKETS FOR ITEMS AND PROFILES
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read profile images" ON storage.objects;
CREATE POLICY "Public read profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Users can upload their own profile photo" ON storage.objects;
CREATE POLICY "Users can upload their own profile photo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Users can update their own profile photo" ON storage.objects;
CREATE POLICY "Users can update their own profile photo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-images');

-- 8. REALTIME SUBSCRIPTION REGISTRATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'contact_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_requests;
  END IF;
END $$;
