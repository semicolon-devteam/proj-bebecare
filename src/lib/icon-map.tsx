import {
  Baby, Bath, Moon, Heart, Shirt, Pill, Syringe, UtensilsCrossed,
  FileText, Hospital, Coins, Stethoscope, School, Plane, Smile,
  Shield, Palmtree, Clock, Briefcase, ClipboardList, Landmark,
  CreditCard, Calendar, Lightbulb, Pin, BookOpen, Home, Scale,
  Users, Droplets, Circle, RefreshCw, Bone, Ruler, HelpCircle,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Baby, Bath, Moon, Heart, Shirt, Pill, Syringe, UtensilsCrossed,
  FileText, Hospital, Coins, Stethoscope, School, Plane, Smile,
  Shield, Palmtree, Clock, Briefcase, ClipboardList, Landmark,
  CreditCard, Calendar, Lightbulb, Pin, BookOpen, Home, Scale,
  Users, Droplets, Circle, RefreshCw, Bone, Ruler, HelpCircle,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || HelpCircle;
}

export function IconByName({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = getIcon(name);
  return <Icon className={className} aria-hidden="true" />;
}
