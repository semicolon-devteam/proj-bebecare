import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '@/components/ui';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
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
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your message...',
    rows: 4,
  },
};

export const WithValue: Story = {
  args: {
    value: 'This is a sample text that has been pre-filled in the textarea.',
    rows: 4,
  },
};

export const LargeRows: Story = {
  args: {
    placeholder: 'Enter a long message...',
    rows: 8,
  },
};

export const Error: Story = {
  args: {
    placeholder: 'Invalid input',
    error: true,
    value: 'This text has an error',
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    value: 'This textarea is disabled',
    disabled: true,
    rows: 4,
  },
};

export const WithMaxLength: Story = {
  args: {
    placeholder: 'Maximum 200 characters',
    maxLength: 200,
    rows: 4,
  },
};
