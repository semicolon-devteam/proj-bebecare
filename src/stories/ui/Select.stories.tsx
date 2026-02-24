import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '@/components/ui';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <option value="">선택해주세요</option>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
      <option value="3">Option 3</option>
    </Select>
  ),
};

export const WithValue: Story = {
  render: () => (
    <Select defaultValue="2">
      <option value="">선택해주세요</option>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
      <option value="3">Option 3</option>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <option value="">선택해주세요</option>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </Select>
  ),
};

export const Error: Story = {
  render: () => (
    <Select error>
      <option value="">선택해주세요</option>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </Select>
  ),
};

export const Regions: Story = {
  render: () => (
    <div className="space-y-4">
      <Select>
        <option value="">시/도 선택</option>
        <option value="서울특별시">서울특별시</option>
        <option value="경기도">경기도</option>
        <option value="인천광역시">인천광역시</option>
      </Select>
      <Select>
        <option value="">시/군/구 선택</option>
        <option value="강남구">강남구</option>
        <option value="서초구">서초구</option>
        <option value="송파구">송파구</option>
      </Select>
    </div>
  ),
};
