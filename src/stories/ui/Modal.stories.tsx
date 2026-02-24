import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import { Button } from '@/components/ui';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Modal Title"
          description="This is a basic modal example"
        >
          <p className="text-sm text-gray-600">
            This is the modal content. You can put any React components here.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const WithoutCloseButton: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Confirm Action"
          showCloseButton={false}
        >
          <p className="text-sm text-gray-600 mb-4">
            This modal has no close button. You must click Cancel or Confirm.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </div>
        </Modal>
      </>
    );
  },
};

export const SmallSize: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Small Modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Small Modal"
          size="sm"
        >
          <p className="text-sm text-gray-600">
            This is a small modal.
          </p>
        </Modal>
      </>
    );
  },
};

export const LargeSize: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Large Modal</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Large Modal"
          size="lg"
        >
          <p className="text-sm text-gray-600">
            This is a large modal with more content space.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              You can add more content here.
            </p>
            <p className="text-sm text-gray-600">
              The modal will accommodate the content.
            </p>
          </div>
        </Modal>
      </>
    );
  },
};

export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete Item
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Delete Item"
          description="This action cannot be undone"
        >
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this item? All associated data will be permanently removed.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                console.log('Item deleted');
                setOpen(false);
              }}
            >
              Delete
            </Button>
          </div>
        </Modal>
      </>
    );
  },
};
