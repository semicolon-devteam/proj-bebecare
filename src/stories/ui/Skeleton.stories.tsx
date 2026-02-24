import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '@/components/ui';
import { Card } from '@/components/ui';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: {
    variant: 'text',
    width: '100%',
    height: 20,
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 48,
    height: 48,
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 120,
  },
};

export const ProfileCard: Story = {
  render: () => (
    <Card padding="md" className="w-80">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </div>
      </div>
    </Card>
  ),
};

export const ListItem: Story = {
  render: () => (
    <div className="space-y-3 w-96">
      {[1, 2, 3].map((i) => (
        <Card key={i} padding="md">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width="70%" height={18} />
              <Skeleton variant="text" width="50%" height={14} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  ),
};

export const ImageCard: Story = {
  render: () => (
    <Card padding="none" className="w-80">
      <Skeleton variant="rectangular" width="100%" height={200} />
      <div className="p-4 space-y-2">
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>
    </Card>
  ),
};

export const Table: Story = {
  render: () => (
    <div className="space-y-2 w-96">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton variant="text" width={80} height={16} />
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width={100} height={16} />
        </div>
      ))}
    </div>
  ),
};
