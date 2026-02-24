import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from '@/components/ui';

const meta: Meta<typeof Radio> = {
  title: 'UI/Radio',
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = {
  args: {
    name: 'size',
    value: 'md',
    label: 'Medium',
  },
};

export const Checked: Story = {
  args: {
    name: 'size',
    value: 'lg',
    label: 'Large',
    checked: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    name: 'option',
    value: '1',
  },
};

export const Disabled: Story = {
  args: {
    name: 'option',
    value: '1',
    label: 'Disabled option',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    name: 'option',
    value: '2',
    label: 'Disabled checked',
    disabled: true,
    checked: true,
  },
};

export const WithError: Story = {
  args: {
    name: 'option',
    value: '1',
    label: 'Invalid selection',
    error: 'Please select a valid option',
  },
};

export const RadioGroup: Story = {
  render: () => (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700 mb-2">Choose a size</p>
      <Radio name="size" value="sm" label="Small" />
      <Radio name="size" value="md" label="Medium" defaultChecked />
      <Radio name="size" value="lg" label="Large" />
      <Radio name="size" value="xl" label="Extra Large" />
    </div>
  ),
};
