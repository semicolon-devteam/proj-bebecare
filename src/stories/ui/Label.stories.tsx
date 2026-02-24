import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '@/components/ui';
import { Input } from '@/components/ui';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
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
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <div>
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="your@email.com" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div>
      <Label htmlFor="name" required>Name</Label>
      <Input id="name" type="text" placeholder="Your name" />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div>
      <Label htmlFor="password" required error="Password is required">
        Password
      </Label>
      <Input id="password" type="password" error />
    </div>
  ),
};

export const LongError: Story = {
  render: () => (
    <div>
      <Label 
        htmlFor="input" 
        required 
        error="This field is required. Please enter a valid email address with at least 8 characters."
      >
        Email
      </Label>
      <Input id="input" type="email" error />
    </div>
  ),
};
