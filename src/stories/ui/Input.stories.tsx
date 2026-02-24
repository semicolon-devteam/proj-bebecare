import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/components/ui';
import { Search, Mail } from 'lucide-react';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Sample text',
    placeholder: 'Enter text...',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'your@email.com',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: '••••••••',
  },
};

export const WithIconLeft: Story = {
  args: {
    icon: <Search className="h-4 w-4" />,
    placeholder: 'Search...',
  },
};

export const WithIconRight: Story = {
  args: {
    iconAfter: <Mail className="h-4 w-4" />,
    placeholder: 'your@email.com',
  },
};

export const Error: Story = {
  args: {
    error: true,
    placeholder: 'Invalid input',
    value: 'wrong@',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    value: 'Cannot edit',
  },
};

export const Date: Story = {
  args: {
    type: 'date',
  },
};
