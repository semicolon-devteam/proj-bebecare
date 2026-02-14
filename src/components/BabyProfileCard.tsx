'use client';

import { useEffect, useState } from 'react';
import { getChildren, deriveStageFromChildren } from '@/lib/children';
import { Baby } from 'lucide-react';

interface Child {
  id: string;
  nickname: string | null;
  birth_date: string | null;
  due_date: string | null;
  gender?: string | null;
  stage?: string;
}

interface BabyProfileCardProps {
  userId: string;
}

export default function BabyProfileCard({ userId }: BabyProfileCardProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const kids = await getChildren(userId);
        const kidsWithStage = kids.map(child => ({
          ...child,
          stage: deriveStageFromChildren([child]),
        }));
        setChildren(kidsWithStage);
      } catch (error) {
        console.error('Error loading children:', error);
      } finally {
        setLoading(false);
      }
    };
    loadChildren();
  }, [userId]);

  if (loading) return null;
  if (children.length === 0) return null;

  const child = children[0]; // 첫 번째 아이 정보 표시

  const calculateAge = () => {
    if (child.birth_date) {
      // 생후 N일 계산
      const birthDate = new Date(child.birth_date);
      const today = new Date();
      const diffTime = today.getTime() - birthDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `생후 ${diffDays}일`;
    } else if (child.due_date) {
      // 임신 주수 계산 (대략적)
      const dueDate = new Date(child.due_date);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const remainingWeeks = Math.floor(diffDays / 7);
      const currentWeeks = 40 - remainingWeeks;
      const currentDays = diffDays % 7;
      
      if (currentWeeks >= 0) {
        return `임신 ${currentWeeks}주 ${currentDays > 0 ? `${currentDays}일` : ''}`;
      } else {
        return `생후 ${Math.abs(diffDays)}일`;
      }
    }
    return '';
  };

  return (
    <div className="card p-4 bg-gradient-to-r from-dusty-rose/5 to-sage/5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-dusty-rose/20 flex items-center justify-center">
          <Baby className="h-6 w-6 text-dusty-rose" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-lg text-gray-900">{child.nickname || '아기'}</h2>
          <p className="text-sm text-gray-500">{calculateAge()}</p>
        </div>
      </div>
    </div>
  );
}