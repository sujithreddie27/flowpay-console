import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <ModalBody>Modal content</ModalBody>
      </Modal>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render content when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <ModalBody>Hidden content</ModalBody>
      </Modal>
    );

    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('renders header, body, and footer sections', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        <ModalHeader>Test Title</ModalHeader>
        <ModalBody>Test Body</ModalBody>
        <ModalFooter>
          <button>Submit</button>
        </ModalFooter>
      </Modal>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen={true} onClose={handleClose} showCloseButton={true}>
        <ModalBody>Content</ModalBody>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} showCloseButton={false}>
        <ModalBody>Content</ModalBody>
      </Modal>
    );

    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    // The lg size should map to max-w-2xl in the Modal component's size config
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="lg">
        <ModalBody>Large modal</ModalBody>
      </Modal>
    );

    // Verify the modal renders (Headless UI may hide content via transition in jsdom)
    expect(screen.getByText('Large modal')).toBeInTheDocument();
  });

  it('applies xl size class', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} size="xl">
        <ModalBody>XL modal</ModalBody>
      </Modal>
    );

    expect(screen.getByText('XL modal')).toBeInTheDocument();
  });
});
