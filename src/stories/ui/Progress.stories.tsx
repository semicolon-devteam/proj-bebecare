import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '@/components/ui';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 50,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
  },
};

export const WithCustomLabel: Story = {
  args: {
    value: 30,
    label: 'Uploading...',
    showLabel: true,
  },
};

export const Success: Story = {
  args: {
    value: 100,
    variant: 'success',
    showLabel: true,
  },
};

export const Warning: Story = {
  args: {
    value: 85,
    variant: 'warning',
    showLabel: true,
  },
};

export const Error: Story = {
  args: {
    value: 15,
    variant: 'error',
    label: 'Failed',
  },
};

export const Small: Story = {
  args: {
    value: 60,
    size: 'sm',
    showLabel: true,
  },
};

export const Large: Story = {
  args: {
    value: 40,
    size: 'lg',
    showLabel: true,
  },
};

export const Zero: Story = {
  args: {
    value: 0,
    showLabel: true,
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    variant: 'success',
    label: 'Complete!',
  },
};
