-- ============================================================
-- Sprint E-1: 가족 동기화 (초대 코드 기반)
-- ============================================================

-- 가족 그룹 테이블
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT '우리 가족',
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 가족 멤버 테이블
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- children에 family_id 추가 (가족 공유 시 가족 전체가 볼 수 있도록)
ALTER TABLE children ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);

-- baby_logs에서 family 내 공유 허용을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);

-- RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- 가족 멤버만 가족 정보 조회 가능
CREATE POLICY "Family members can view family"
  ON families FOR SELECT
  USING (id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- 가족 생성자만 수정 가능
CREATE POLICY "Family creator can update"
  ON families FOR UPDATE
  USING (created_by = auth.uid());

-- 가족 멤버 조회: 같은 가족 멤버만
CREATE POLICY "Members can view family members"
  ON family_members FOR SELECT
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- 본인의 멤버십만 삭제 가능 (탈퇴)
CREATE POLICY "Users can leave family"
  ON family_members FOR DELETE
  USING (user_id = auth.uid());

-- INSERT는 API를 통해 service_role로만
CREATE POLICY "Service role insert families"
  ON families FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role insert members"
  ON family_members FOR INSERT
  WITH CHECK (true);

-- baby_logs RLS 업데이트: 가족 멤버도 조회 가능
DROP POLICY IF EXISTS "Users can manage own baby logs" ON baby_logs;

CREATE POLICY "Users can manage own baby logs"
  ON baby_logs FOR ALL
  USING (
    auth.uid() = user_id
    OR user_id IN (
      SELECT fm2.user_id FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid()
    )
  )
  WITH CHECK (auth.uid() = user_id);
