import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '@/components/ui';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
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
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    label: 'Enable notifications',
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Dark mode',
    description: 'Switch between light and dark theme',
  },
};

export const Checked: Story = {
  args: {
    label: 'Enabled',
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled',
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled (checked)',
    disabled: true,
    checked: true,
  },
};

export const WithoutLabel: Story = {
  args: {},
};

export const SettingsGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch 
        label="이메일 알림" 
        description="새로운 메시지가 도착하면 이메일로 알려드립니다"
      />
      <Switch 
        label="푸시 알림" 
        description="앱 알림을 받습니다"
        checked
      />
      <Switch 
        label="SMS 알림" 
        description="문자 메시지로 알림을 받습니다"
      />
    </div>
  ),
};
