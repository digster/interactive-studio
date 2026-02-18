import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PreviewPane from '../../../../src/components/preview/PreviewPane';
import { useExecutionStore } from '../../../../src/store/executionStore';

describe('PreviewPane', () => {
  beforeEach(() => {
    useExecutionStore.setState({ previewType: 'none', previewContent: '' });
  });

  it('should show the Preview label', () => {
    render(<PreviewPane />);
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('should show placeholder text', () => {
    render(<PreviewPane />);
    expect(screen.getByText('Preview will appear here')).toBeInTheDocument();
  });

  it('should show the refresh button', () => {
    render(<PreviewPane />);
    expect(screen.getByLabelText('Refresh preview')).toBeInTheDocument();
  });

  it('should show preview type indicator when type is set', () => {
    useExecutionStore.setState({ previewType: 'html' });
    render(<PreviewPane />);
    expect(screen.getByText('html')).toBeInTheDocument();
  });
});
