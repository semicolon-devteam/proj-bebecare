'use client';

import { useEffect, useState } from 'react';
import { getChildren, deriveStageFromChildren } from '@/lib/children';
import { Baby, Calendar, Heart } from 'lucide-react';
import { Card, Avatar, Badge } from '@/components/ui';

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

  if (loading) {
    return (
      <Card shadow="md" padding="lg" className="bg-gradient-profile animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </Card>
    );
  }

  if (children.length === 0) {
    return (
      <Card shadow="md" padding="lg" className="bg-gradient-profile">
        <div className="text-center py-6">
          <Baby className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-body text-gray-500">아이 정보가 없습니다</p>
          <p className="text-body-sm text-gray-400 mt-1">설정에서 추가해주세요</p>
        </div>
      </Card>
    );
  }

  const child = children[0]; // 첫 번째 아이 정보 표시

  const calculateAge = () => {
    if (child.birth_date) {
      // 생후 N일 계산
      const birthDate = new Date(child.birth_date);
      const today = new Date();
      const diffTime = today.getTime() - birthDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return { text: `생후 ${diffDays}일`, icon: Baby, variant: 'info' as const };
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return { text: `생후 ${months}개월`, icon: Baby, variant: 'info' as const };
      } else {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        return { 
          text: `${years}세 ${months > 0 ? `${months}개월` : ''}`, 
          icon: Baby, 
          variant: 'info' as const 
        };
      }
    } else if (child.due_date) {
      // 임신 주수 계산 (대략적)
      const dueDate = new Date(child.due_date);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const remainingWeeks = Math.floor(diffDays / 7);
      const currentWeeks = 40 - remainingWeeks;
      const currentDays = 7 - (diffDays % 7);
      
      if (currentWeeks >= 0 && currentWeeks <= 40) {
        return { 
          text: `임신 ${currentWeeks}주 ${currentDays > 0 && currentDays < 7 ? `${currentDays}일` : ''}`, 
          icon: Heart, 
          variant: 'default' as const 
        };
      } else if (diffDays < 0) {
        return { text: `생후 ${Math.abs(diffDays)}일`, icon: Baby, variant: 'info' as const };
      } else {
        return { text: '곧 만나요', icon: Heart, variant: 'default' as const };
      }
    }
    return { text: '정보 없음', icon: Calendar, variant: 'outline' as const };
  };

  const ageInfo = calculateAge();
  const AgeIcon = ageInfo.icon;

  return (
    <Card shadow="lg" padding="lg" hover="lift" className="bg-gradient-profile">
      <div className="flex items-center gap-4">
        <Avatar
          fallback={child.nickname?.slice(0, 2).toUpperCase() || '👶'}
          size="2xl"
        />
        <div className="flex-1">
          <h2 className="text-h3 font-bold text-gray-900 mb-2">
            {child.nickname || '우리 아기'}
          </h2>
          <Badge variant={ageInfo.variant} size="md" icon={<AgeIcon className="h-4 w-4" />}>
            {ageInfo.text}
          </Badge>
          {child.gender && (
            <Badge variant="secondary" size="sm" className="ml-2">
              {child.gender === 'male' ? '남아' : child.gender === 'female' ? '여아' : ''}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
