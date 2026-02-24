import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { Button } from '@/components/ui';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
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
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardContent>
        <p>This is a basic card with default styling.</p>
      </CardContent>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Action</CardTitle>
        <CardDescription>Are you sure you want to proceed?</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This action cannot be undone.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">Cancel</Button>
        <Button variant="primary" size="sm">Confirm</Button>
      </CardFooter>
    </Card>
  ),
};

export const LargeShadow: Story = {
  render: () => (
    <Card shadow="lg">
      <CardContent>
        <p>Card with large shadow</p>
      </CardContent>
    </Card>
  ),
};

export const ExtraLargeShadow: Story = {
  render: () => (
    <Card shadow="xl">
      <CardContent>
        <p>Card with extra large shadow</p>
      </CardContent>
    </Card>
  ),
};

export const HoverLift: Story = {
  render: () => (
    <Card hover="lift">
      <CardContent>
        <p>Hover me to see lift effect</p>
      </CardContent>
    </Card>
  ),
};

export const NoPadding: Story = {
  render: () => (
    <Card padding="none">
      <img
        src="https://via.placeholder.com/400x200"
        alt="Placeholder"
        style={{ width: '100%', borderRadius: '1.25rem 1.25rem 0 0' }}
      />
      <div className="p-4">
        <h3 className="font-bold text-lg">Image Card</h3>
        <p className="text-sm text-gray-600">Card with custom padding</p>
      </div>
    </Card>
  ),
};
