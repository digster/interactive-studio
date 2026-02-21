import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PreviewPane from '../../../../src/components/preview/PreviewPane';
import { useExecutionStore } from '../../../../src/store/executionStore';

describe('PreviewPane', () => {
  beforeEach(() => {
    useExecutionStore.setState({
      previewType: 'none',
      previewContent: '',
      previewUrl: null,
      pythonOutput: '',
      pythonOutputReady: false,
      isRunning: false,
      runningMode: null,
    });
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

  // --- Python preview ---

  it('should show "Run to see preview" when python type with no output and not running', () => {
    useExecutionStore.setState({ previewType: 'python' });
    render(<PreviewPane />);
    expect(screen.getByText('Run to see preview')).toBeInTheDocument();
  });

  it('should show "Running..." spinner when python is running with no output yet', () => {
    useExecutionStore.setState({ previewType: 'python', isRunning: true });
    render(<PreviewPane />);
    expect(screen.getByText('Running...')).toBeInTheDocument();
  });

  it('should show python text output in a pre element', () => {
    useExecutionStore.setState({
      previewType: 'python',
      pythonOutput: 'Hello, World!\n',
      pythonOutputReady: true,
    });
    render(<PreviewPane />);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  it('should render HTML output in an iframe when python output looks like HTML', () => {
    const htmlOutput = '<!DOCTYPE html><html><body><h1>Test</h1></body></html>';
    useExecutionStore.setState({
      previewType: 'python',
      pythonOutput: htmlOutput,
      pythonOutputReady: true,
    });
    render(<PreviewPane />);
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('srcdoc')).toBe(htmlOutput);
    expect(iframe?.title).toBe('Python HTML Output');
  });

  it('should render HTML output detected by <html tag', () => {
    const htmlOutput = '<html><body>Hello</body></html>';
    useExecutionStore.setState({
      previewType: 'python',
      pythonOutput: htmlOutput,
      pythonOutputReady: true,
    });
    render(<PreviewPane />);
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeTruthy();
  });

  it('should show python type indicator in header', () => {
    useExecutionStore.setState({ previewType: 'python' });
    render(<PreviewPane />);
    expect(screen.getByText('python')).toBeInTheDocument();
  });

  it('should render URL preview iframe for app mode', () => {
    useExecutionStore.setState({
      previewType: 'url',
      previewUrl: 'http://127.0.0.1:8050/',
    });
    render(<PreviewPane />);
    const iframe = document.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.getAttribute('src')).toBe('http://127.0.0.1:8050/');
    expect(iframe?.title).toBe('Python App Preview');
  });

  it('should show waiting message when URL preview has no URL yet', () => {
    useExecutionStore.setState({
      previewType: 'url',
      previewUrl: null,
    });
    render(<PreviewPane />);
    expect(screen.getByText('Waiting for app server...')).toBeInTheDocument();
  });

  it('should show text output as pre even while still running', () => {
    useExecutionStore.setState({
      previewType: 'python',
      pythonOutput: 'partial output...',
      isRunning: true,
    });
    render(<PreviewPane />);
    expect(screen.getByText(/partial output/)).toBeInTheDocument();
  });
});
