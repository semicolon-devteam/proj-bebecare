import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '@/components/ui';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=1',
    alt: 'User avatar',
  },
};

export const WithFallback: Story = {
  args: {
    fallback: 'JD',
  },
};

export const NoImageNoFallback: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=2',
    alt: 'Small avatar',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=3',
    alt: 'Medium avatar',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=4',
    alt: 'Large avatar',
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=5',
    alt: 'Extra large avatar',
    size: 'xl',
  },
};

export const DoubleExtraLarge: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=6',
    alt: 'Double extra large avatar',
    size: '2xl',
  },
};

export const FallbackSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar fallback="SM" size="sm" />
      <Avatar fallback="MD" size="md" />
      <Avatar fallback="LG" size="lg" />
      <Avatar fallback="XL" size="xl" />
      <Avatar fallback="2X" size="2xl" />
    </div>
  ),
};

export const BrokenImageFallback: Story = {
  args: {
    src: 'https://invalid-url.com/image.jpg',
    fallback: 'BR',
  },
};
