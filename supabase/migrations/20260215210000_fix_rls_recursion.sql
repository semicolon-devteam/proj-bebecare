-- Fix infinite recursion in RLS policies
-- Problem: baby_logs policy → family_members → family_members SELECT policy → family_members (loop)

-- Fix family_members SELECT policy: use direct uid check, no self-reference
DROP POLICY IF EXISTS "Members can view family members" ON family_members;
CREATE POLICY "Members can view family members"
  ON family_members FOR SELECT
  USING (
    -- Direct check: user belongs to this family
    family_id IN (
      SELECT fm.family_id FROM family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- The above still self-references. Use security definer function instead.
DROP POLICY IF EXISTS "Members can view family members" ON family_members;

-- Create a security definer function to get family IDs for a user
CREATE OR REPLACE FUNCTION get_user_family_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT family_id FROM family_members WHERE user_id = uid;
$$;

-- Recreate family_members SELECT policy using the function
CREATE POLICY "Members can view family members"
  ON family_members FOR SELECT
  USING (family_id IN (SELECT get_user_family_ids(auth.uid())));

-- Fix baby_logs policy using the same function
DROP POLICY IF EXISTS "Users can manage own baby logs" ON baby_logs;

CREATE POLICY "Users can read own or family baby logs"
  ON baby_logs FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IN (
      SELECT fm.user_id FROM family_members fm
      WHERE fm.family_id IN (SELECT get_user_family_ids(auth.uid()))
    )
  );

CREATE POLICY "Users can insert own baby logs"
  ON baby_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own baby logs"
  ON baby_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own baby logs"
  ON baby_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Fix families SELECT policy
DROP POLICY IF EXISTS "Family members can view family" ON families;
CREATE POLICY "Family members can view family"
  ON families FOR SELECT
  USING (id IN (SELECT get_user_family_ids(auth.uid())));
