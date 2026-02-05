import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CTSearchBar } from '@/components/molecules/CTSearchBar';

describe('CTSearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render search input', () => {
      render(<CTSearchBar />);
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      render(<CTSearchBar />);
      expect(screen.getByPlaceholderText('검색')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<CTSearchBar placeholder="교인 검색" />);
      expect(screen.getByPlaceholderText('교인 검색')).toBeInTheDocument();
    });

    it('should render search icon', () => {
      const { container } = render(<CTSearchBar />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('controlled mode', () => {
    it('should display controlled value', () => {
      render(<CTSearchBar value="김철수" onChange={() => {}} />);
      expect(screen.getByRole('searchbox')).toHaveValue('김철수');
    });

    it('should update when controlled value changes', () => {
      const { rerender } = render(<CTSearchBar value="김철수" onChange={() => {}} />);
      expect(screen.getByRole('searchbox')).toHaveValue('김철수');

      rerender(<CTSearchBar value="이영희" onChange={() => {}} />);
      expect(screen.getByRole('searchbox')).toHaveValue('이영희');
    });

    it('should call onChange when input changes', () => {
      const handleChange = vi.fn();
      render(<CTSearchBar value="" onChange={handleChange} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '김철수' } });

      expect(handleChange).toHaveBeenCalledWith('김철수');
    });
  });

  describe('uncontrolled mode', () => {
    it('should manage its own state', () => {
      render(<CTSearchBar />);
      const input = screen.getByRole('searchbox');

      fireEvent.change(input, { target: { value: '김철수' } });
      expect(input).toHaveValue('김철수');
    });

    it('should call onChange in uncontrolled mode', () => {
      const handleChange = vi.fn();
      render(<CTSearchBar onChange={handleChange} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '김철수' } });

      expect(handleChange).toHaveBeenCalledWith('김철수');
    });
  });

  describe('search functionality', () => {
    it('should debounce onSearch calls', async () => {
      const handleSearch = vi.fn();
      render(<CTSearchBar onSearch={handleSearch} debounceMs={300} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '김' } });
      fireEvent.change(input, { target: { value: '김철' } });
      fireEvent.change(input, { target: { value: '김철수' } });

      expect(handleSearch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledTimes(1);
        expect(handleSearch).toHaveBeenCalledWith('김철수');
      });
    });

    it('should trigger search immediately on Enter key', () => {
      const handleSearch = vi.fn();
      render(<CTSearchBar onSearch={handleSearch} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '김철수' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(handleSearch).toHaveBeenCalledWith('김철수');
    });

    it('should use custom debounce time', async () => {
      const handleSearch = vi.fn();
      render(<CTSearchBar onSearch={handleSearch} debounceMs={500} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '김철수' } });

      vi.advanceTimersByTime(300);
      expect(handleSearch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);
      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('김철수');
      });
    });

    it('should cancel previous debounce on new input', async () => {
      const handleSearch = vi.fn();
      render(<CTSearchBar onSearch={handleSearch} debounceMs={300} />);

      const input = screen.getByRole('searchbox');

      fireEvent.change(input, { target: { value: '김' } });
      vi.advanceTimersByTime(200);

      fireEvent.change(input, { target: { value: '김철수' } });
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledTimes(1);
        expect(handleSearch).toHaveBeenCalledWith('김철수');
      });
    });
  });

  describe('clear button', () => {
    it('should show clear button when input has value', () => {
      render(<CTSearchBar value="김철수" onChange={() => {}} />);
      const clearButton = screen.getByRole('button', { name: '검색어 지우기' });
      expect(clearButton).toBeInTheDocument();
    });

    it('should not show clear button when input is empty', () => {
      render(<CTSearchBar value="" onChange={() => {}} />);
      const clearButton = screen.queryByRole('button', { name: '검색어 지우기' });
      expect(clearButton).not.toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', () => {
      const handleChange = vi.fn();
      const handleSearch = vi.fn();
      render(
        <CTSearchBar
          value="김철수"
          onChange={handleChange}
          onSearch={handleSearch}
        />
      );

      const clearButton = screen.getByRole('button', { name: '검색어 지우기' });
      fireEvent.click(clearButton);

      expect(handleChange).toHaveBeenCalledWith('');
      expect(handleSearch).toHaveBeenCalledWith('');
    });

    it('should clear uncontrolled input', () => {
      render(<CTSearchBar />);
      const input = screen.getByRole('searchbox');

      fireEvent.change(input, { target: { value: '김철수' } });
      expect(input).toHaveValue('김철수');

      const clearButton = screen.getByRole('button', { name: '검색어 지우기' });
      fireEvent.click(clearButton);

      expect(input).toHaveValue('');
    });
  });

  describe('autoFocus', () => {
    it('should auto-focus input when autoFocus is true', () => {
      render(<CTSearchBar autoFocus />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveFocus();
    });

    it('should not auto-focus by default', () => {
      render(<CTSearchBar />);
      const input = screen.getByRole('searchbox');
      expect(input).not.toHaveFocus();
    });
  });

  describe('custom className', () => {
    it('should apply custom className to wrapper', () => {
      const { container } = render(<CTSearchBar className="custom-class" />);
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should merge custom className with default classes', () => {
      const { container } = render(<CTSearchBar className="custom-class" />);
      const wrapper = container.querySelector('.relative.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('keyboard interactions', () => {
    it('should handle Enter key', () => {
      const handleSearch = vi.fn();
      render(<CTSearchBar onSearch={handleSearch} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '김철수' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(handleSearch).toHaveBeenCalledWith('김철수');
    });

    it('should not trigger search on other keys', () => {
      const handleSearch = vi.fn();
      render(<CTSearchBar onSearch={handleSearch} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '김철수' } });
      fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(handleSearch).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper input type', () => {
      render(<CTSearchBar />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should have aria-label on clear button', () => {
      render(<CTSearchBar value="김철수" onChange={() => {}} />);
      const clearButton = screen.getByRole('button', { name: '검색어 지우기' });
      expect(clearButton).toHaveAttribute('aria-label', '검색어 지우기');
    });
  });

  describe('cleanup', () => {
    it('should cleanup debounce timer on unmount', async () => {
      const handleSearch = vi.fn();
      const { unmount } = render(<CTSearchBar onSearch={handleSearch} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '김철수' } });

      unmount();
      vi.advanceTimersByTime(300);

      // Search should not be called after unmount
      expect(handleSearch).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string value', () => {
      render(<CTSearchBar value="" onChange={() => {}} />);
      expect(screen.getByRole('searchbox')).toHaveValue('');
    });

    it('should handle special characters', () => {
      const handleChange = vi.fn();
      render(<CTSearchBar onChange={handleChange} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '!@#$%^&*()' } });

      expect(handleChange).toHaveBeenCalledWith('!@#$%^&*()');
    });

    it('should handle Korean and English mixed input', () => {
      const handleChange = vi.fn();
      render(<CTSearchBar onChange={handleChange} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: 'John 김철수' } });

      expect(handleChange).toHaveBeenCalledWith('John 김철수');
    });

    it('should handle whitespace', () => {
      const handleChange = vi.fn();
      render(<CTSearchBar onChange={handleChange} />);

      const input = screen.getByRole('searchbox');
      fireEvent.change(input, { target: { value: '  김철수  ' } });

      expect(handleChange).toHaveBeenCalledWith('  김철수  ');
    });
  });
});
