const { describe, it, expect } = require('@jest/globals');
const { normalizePath, expandHome, convertToWindowsPath } = require('../path-utils.cjs');

describe('Path Utilities', () => {
  describe('convertToWindowsPath', () => {
    it('leaves Unix paths unchanged', () => {
      expect(convertToWindowsPath('/usr/local/bin'))
        .toBe('/usr/local/bin');
      expect(convertToWindowsPath('/home/user/some path'))
        .toBe('/home/user/some path');
    });

    it('converts WSL paths to Windows format', () => {
      expect(convertToWindowsPath('/mnt/c/NS/MyKindleContent'))
        .toBe('C:\\NS\\MyKindleContent');
    });

    it('converts Unix-style Windows paths to Windows format', () => {
      expect(convertToWindowsPath('/c/NS/MyKindleContent'))
        .toBe('C:\\NS\\MyKindleContent');
    });

    it('leaves Windows paths unchanged but ensures backslashes', () => {
      expect(convertToWindowsPath('C:\\NS\\MyKindleContent'))
        .toBe('C:\\NS\\MyKindleContent');
      expect(convertToWindowsPath('C:/NS/MyKindleContent'))
        .toBe('C:\\NS\\MyKindleContent');
    });

    it('handles Windows paths with spaces', () => {
      expect(convertToWindowsPath('C:\\Program Files\\Some App'))
        .toBe('C:\\Program Files\\Some App');
      expect(convertToWindowsPath('C:/Program Files/Some App'))
        .toBe('C:\\Program Files\\Some App');
    });

    it('handles uppercase and lowercase drive letters', () => {
      expect(convertToWindowsPath('/mnt/d/some/path'))
        .toBe('D:\\some\\path');
      expect(convertToWindowsPath('/d/some/path'))
        .toBe('D:\\some\\path');
    });
  });

  describe('normalizePath', () => {
    it('preserves Unix paths', () => {
      expect(normalizePath('/usr/local/bin'))
        .toBe('/usr/local/bin');
      expect(normalizePath('/home/user/some path'))
        .toBe('/home/user/some path');
      expect(normalizePath('"/usr/local/some app/"'))
        .toBe('/usr/local/some app');
    });

    it('removes surrounding quotes', () => {
      expect(normalizePath('"C:\\NS\\My Kindle Content"'))
        .toBe('C:\\NS\\My Kindle Content');
    });

    it('normalizes backslashes', () => {
      expect(normalizePath('C:\\\\NS\\\\MyKindleContent'))
        .toBe('C:\\NS\\MyKindleContent');
    });

    it('converts forward slashes to backslashes on Windows', () => {
      expect(normalizePath('C:/NS/MyKindleContent'))
        .toBe('C:\\NS\\MyKindleContent');
    });

    it('handles WSL paths', () => {
      expect(normalizePath('/mnt/c/NS/MyKindleContent'))
        .toBe('C:\\NS\\MyKindleContent');
    });

    it('handles Unix-style Windows paths', () => {
      expect(normalizePath('/c/NS/MyKindleContent'))
        .toBe('C:\\NS\\MyKindleContent');
    });

    it('handles paths with spaces and mixed slashes', () => {
      expect(normalizePath('C:/NS/My Kindle Content'))
        .toBe('C:\\NS\\My Kindle Content');
      expect(normalizePath('/mnt/c/NS/My Kindle Content'))
        .toBe('C:\\NS\\My Kindle Content');
      expect(normalizePath('C:\\Program Files (x86)\\App Name'))
        .toBe('C:\\Program Files (x86)\\App Name');
      expect(normalizePath('"C:\\Program Files\\App Name"'))
        .toBe('C:\\Program Files\\App Name');
      expect(normalizePath('  C:\\Program Files\\App Name  '))
        .toBe('C:\\Program Files\\App Name');
    });

    it('preserves spaces in all path formats', () => {
      expect(normalizePath('/mnt/c/Program Files/App Name'))
        .toBe('C:\\Program Files\\App Name');
      expect(normalizePath('/c/Program Files/App Name'))
        .toBe('C:\\Program Files\\App Name');
      expect(normalizePath('C:/Program Files/App Name'))
        .toBe('C:\\Program Files\\App Name');
    });

    it('handles special characters in paths', () => {
      // Test ampersand in path
      expect(normalizePath('C:\\NS\\Sub&Folder'))
        .toBe('C:\\NS\\Sub&Folder');
      expect(normalizePath('C:/NS/Sub&Folder'))
        .toBe('C:\\NS\\Sub&Folder');
      expect(normalizePath('/mnt/c/NS/Sub&Folder'))
        .toBe('C:\\NS\\Sub&Folder');
      
      // Test tilde in path (short names in Windows)
      expect(normalizePath('C:\\NS\\MYKIND~1'))
        .toBe('C:\\NS\\MYKIND~1');
      expect(normalizePath('/Users/NEMANS~1/FOLDER~2/SUBFO~1/Public/P12PST~1'))
        .toBe('/Users/NEMANS~1/FOLDER~2/SUBFO~1/Public/P12PST~1');
      
      // Test other special characters
      expect(normalizePath('C:\\Path with #hash'))
        .toBe('C:\\Path with #hash');
      expect(normalizePath('C:\\Path with (parentheses)'))
        .toBe('C:\\Path with (parentheses)');
      expect(normalizePath('C:\\Path with [brackets]'))
        .toBe('C:\\Path with [brackets]');
      expect(normalizePath('C:\\Path with @at+plus$dollar%percent'))
        .toBe('C:\\Path with @at+plus$dollar%percent');
    });
  });

  describe('expandHome', () => {
    it('expands ~ to home directory', () => {
      const result = expandHome('~/test');
      expect(result).toContain('test');
      expect(result).not.toContain('~');
    });

    it('leaves other paths unchanged', () => {
      expect(expandHome('C:/test')).toBe('C:/test');
    });
  });
});
