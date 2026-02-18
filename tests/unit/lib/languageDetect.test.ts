import { describe, it, expect } from 'vitest';
import { detectLanguage, getPreviewType, isExecutable, getLanguageLabel } from '../../../src/lib/languageDetect';

describe('languageDetect', () => {
  describe('getPreviewType', () => {
    it('should return "python" for python language', () => {
      expect(getPreviewType('python')).toBe('python');
    });

    it('should return "html" for html language', () => {
      expect(getPreviewType('html')).toBe('html');
    });

    it('should return "html" for javascript/css (web languages)', () => {
      expect(getPreviewType('javascript')).toBe('html');
      expect(getPreviewType('typescript')).toBe('html');
      expect(getPreviewType('css')).toBe('html');
    });

    it('should return "markdown" for markdown', () => {
      expect(getPreviewType('markdown')).toBe('markdown');
    });

    it('should return "none" for unsupported languages', () => {
      expect(getPreviewType('rust')).toBe('none');
      expect(getPreviewType('shell')).toBe('none');
    });
  });

  describe('detectLanguage', () => {
    it('should detect python from .py extension', () => {
      expect(detectLanguage('main.py')).toBe('python');
      expect(detectLanguage('script.pyw')).toBe('python');
    });
  });

  describe('isExecutable', () => {
    it('should return true for python', () => {
      expect(isExecutable('python')).toBe(true);
    });
  });

  describe('getLanguageLabel', () => {
    it('should return "Python" for python', () => {
      expect(getLanguageLabel('python')).toBe('Python');
    });
  });
});
