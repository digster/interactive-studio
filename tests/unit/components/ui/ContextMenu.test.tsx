import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContextMenu, { type ContextMenuItem } from '../../../../src/components/ui/ContextMenu';

describe('ContextMenu', () => {
  const onClose = vi.fn();
  const onClick1 = vi.fn();
  const onClick2 = vi.fn();

  const items: ContextMenuItem[] = [
    { label: 'Rename', onClick: onClick1 },
    { label: 'Delete', onClick: onClick2, danger: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render menu items', () => {
    render(<ContextMenu x={100} y={100} items={items} onClose={onClose} />);
    expect(screen.getByText('Rename')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should call onClick when item is clicked', () => {
    render(<ContextMenu x={100} y={100} items={items} onClose={onClose} />);
    fireEvent.click(screen.getByText('Rename'));
    expect(onClick1).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when item is clicked', () => {
    render(<ContextMenu x={100} y={100} items={items} onClose={onClose} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should close on Escape key', () => {
    render(<ContextMenu x={100} y={100} items={items} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render separator items', () => {
    const itemsWithSeparator: ContextMenuItem[] = [
      { label: 'Copy', onClick: vi.fn() },
      { label: '', onClick: vi.fn(), separator: true },
      { label: 'Paste', onClick: vi.fn() },
    ];
    render(
      <ContextMenu x={100} y={100} items={itemsWithSeparator} onClose={onClose} />,
    );
    // The menu renders via portal into document.body
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Paste')).toBeInTheDocument();
    // Only 2 clickable buttons (separator is a div, not a button)
    const menuButtons = screen.getAllByRole('button');
    expect(menuButtons).toHaveLength(2);
  });
});
