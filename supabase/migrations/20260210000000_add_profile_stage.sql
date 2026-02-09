-- profiles 테이블이 없을 경우 대비 (초기 마이그레이션 미적용 복구)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  is_pregnant BOOLEAN DEFAULT false,
  due_date DATE,
  is_working BOOLEAN DEFAULT false,
  region_province VARCHAR(50),
  region_city VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- children 테이블
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100),
  birth_date DATE NOT NULL,
  gender VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (IF NOT EXISTS 불가하므로 DROP 후 CREATE)
DO $$
BEGIN
  -- profiles policies
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

  -- children policies
  DROP POLICY IF EXISTS "Users can view own children" ON children;
  DROP POLICY IF EXISTS "Users can insert own children" ON children;
  DROP POLICY IF EXISTS "Users can update own children" ON children;
  DROP POLICY IF EXISTS "Users can delete own children" ON children;
  CREATE POLICY "Users can view own children" ON children FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own children" ON children FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own children" ON children FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own children" ON children FOR DELETE USING (auth.uid() = user_id);
END $$;

-- 새 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stage VARCHAR(20) DEFAULT 'planning';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pregnancy_start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stage ON profiles(stage);
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
