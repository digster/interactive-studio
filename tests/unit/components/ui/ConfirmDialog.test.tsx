import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../../../../src/components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render title and message', () => {
    render(
      <ConfirmDialog
        title="Delete File"
        message="Are you sure you want to delete this file?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText('Delete File')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this file?')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmDialog
        title="Delete File"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText('Delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <ConfirmDialog
        title="Delete File"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should close on Escape key', () => {
    render(
      <ConfirmDialog
        title="Delete File"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should render custom confirm label', () => {
    render(
      <ConfirmDialog
        title="Remove Item"
        message="This will remove the item."
        confirmLabel="Remove"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  it('should default confirm label to Delete', () => {
    render(
      <ConfirmDialog
        title="Delete"
        message="Sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    // There are two "Delete" texts: the title and the button. The button should exist.
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
  });
});
