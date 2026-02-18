import { describe, it, expect } from 'vitest';
import { getLanguageExtension } from '../../../../src/components/editor/cmLanguages';

describe('cmLanguages', () => {
  it('should return extension for javascript', () => {
    expect(getLanguageExtension('javascript')).not.toBeNull();
  });

  it('should return extension for typescript', () => {
    expect(getLanguageExtension('typescript')).not.toBeNull();
  });

  it('should return extension for jsx', () => {
    expect(getLanguageExtension('jsx')).not.toBeNull();
  });

  it('should return extension for tsx', () => {
    expect(getLanguageExtension('tsx')).not.toBeNull();
  });

  it('should return extension for html', () => {
    expect(getLanguageExtension('html')).not.toBeNull();
  });

  it('should return extension for css', () => {
    expect(getLanguageExtension('css')).not.toBeNull();
  });

  it('should return extension for python', () => {
    expect(getLanguageExtension('python')).not.toBeNull();
  });

  it('should return extension for json', () => {
    expect(getLanguageExtension('json')).not.toBeNull();
  });

  it('should return extension for markdown', () => {
    expect(getLanguageExtension('markdown')).not.toBeNull();
  });

  it('should return null for unsupported language', () => {
    expect(getLanguageExtension('rust')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(getLanguageExtension('')).toBeNull();
  });
});
