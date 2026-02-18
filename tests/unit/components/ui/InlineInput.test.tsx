import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InlineInput from '../../../../src/components/ui/InlineInput';

describe('InlineInput', () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default value', () => {
    render(<InlineInput defaultValue="hello.txt" onSubmit={onSubmit} onCancel={onCancel} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('hello.txt');
  });

  it('should call onSubmit on Enter with trimmed value', () => {
    render(<InlineInput defaultValue="  myfile.ts  " onSubmit={onSubmit} onCancel={onCancel} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('myfile.ts');
  });

  it('should call onCancel on Escape', () => {
    render(<InlineInput defaultValue="test.txt" onSubmit={onSubmit} onCancel={onCancel} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should call onCancel when empty and Enter is pressed', () => {
    render(<InlineInput defaultValue="" onSubmit={onSubmit} onCancel={onCancel} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should call onCancel when value is whitespace only and Enter is pressed', () => {
    render(<InlineInput defaultValue="   " onSubmit={onSubmit} onCancel={onCancel} />);
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when blurred with empty value', () => {
    render(<InlineInput defaultValue="" onSubmit={onSubmit} onCancel={onCancel} />);
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when blurred with unchanged value', () => {
    render(<InlineInput defaultValue="original.txt" onSubmit={onSubmit} onCancel={onCancel} />);
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit when blurred with changed value', () => {
    render(<InlineInput defaultValue="original.txt" onSubmit={onSubmit} onCancel={onCancel} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'renamed.txt' } });
    fireEvent.blur(input);
    expect(onSubmit).toHaveBeenCalledWith('renamed.txt');
  });

  it('should render with placeholder', () => {
    render(
      <InlineInput
        defaultValue=""
        onSubmit={onSubmit}
        onCancel={onCancel}
        placeholder="Enter filename"
      />,
    );
    const input = screen.getByPlaceholderText('Enter filename');
    expect(input).toBeInTheDocument();
  });
});
