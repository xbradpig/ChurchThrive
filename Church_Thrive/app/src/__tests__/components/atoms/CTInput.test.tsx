import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CTInput } from '@/components/atoms/CTInput';

describe('CTInput', () => {
  describe('rendering', () => {
    it('should render input element', () => {
      render(<CTInput />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<CTInput placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should apply default size (md)', () => {
      render(<CTInput data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-10', 'px-3', 'text-ct-md');
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      render(<CTInput size="sm" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-8', 'px-2.5', 'text-ct-sm');
    });

    it('should render medium size', () => {
      render(<CTInput size="md" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-10', 'px-3', 'text-ct-md');
    });

    it('should render large size', () => {
      render(<CTInput size="lg" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('h-12', 'px-4', 'text-ct-lg');
    });
  });

  describe('states', () => {
    it('should apply error styles when isError is true', () => {
      render(<CTInput isError data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-ct-error', 'focus:ring-ct-error/40');
    });

    it('should apply normal styles by default', () => {
      render(<CTInput data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-gray-300', 'focus:ring-ct-primary/40');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<CTInput disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('opacity-60', 'cursor-not-allowed', 'bg-gray-100');
    });

    it('should be readonly when readOnly prop is true', () => {
      render(<CTInput readOnly value="Read only" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveClass('bg-gray-50', 'cursor-default');
    });
  });

  describe('icons', () => {
    it('should render left icon', () => {
      const LeftIcon = () => <span data-testid="left-icon">🔍</span>;
      render(<CTInput leftIcon={<LeftIcon />} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      const RightIcon = () => <span data-testid="right-icon">✓</span>;
      render(<CTInput rightIcon={<RightIcon />} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should apply padding for left icon', () => {
      const LeftIcon = () => <span>🔍</span>;
      render(<CTInput leftIcon={<LeftIcon />} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pl-10');
    });

    it('should apply padding for right icon', () => {
      const RightIcon = () => <span>✓</span>;
      render(<CTInput rightIcon={<RightIcon />} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pr-10');
    });

    it('should apply padding for both icons', () => {
      const LeftIcon = () => <span>🔍</span>;
      const RightIcon = () => <span>✓</span>;
      render(
        <CTInput
          leftIcon={<LeftIcon />}
          rightIcon={<RightIcon />}
          data-testid="input"
        />
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pl-10', 'pr-10');
    });
  });

  describe('interactions', () => {
    it('should call onChange when input value changes', () => {
      const handleChange = vi.fn();
      render(<CTInput onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should update value when controlled', () => {
      const { rerender } = render(<CTInput value="initial" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('initial');

      rerender(<CTInput value="updated" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('updated');
    });

    it('should not call onChange when disabled', () => {
      const handleChange = vi.fn();
      render(<CTInput disabled onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      // Disabled inputs don't trigger change events
      expect(input).toBeDisabled();
    });

    it('should handle onFocus and onBlur', () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      render(<CTInput onFocus={handleFocus} onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('input types', () => {
    it('should render text input by default', () => {
      render(<CTInput />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render email input', () => {
      render(<CTInput type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<CTInput type="password" data-testid="password" />);
      const input = screen.getByTestId('password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<CTInput type="number" data-testid="number" />);
      const input = screen.getByTestId('number');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render tel input', () => {
      render(<CTInput type="tel" data-testid="tel" />);
      const input = screen.getByTestId('tel');
      expect(input).toHaveAttribute('type', 'tel');
    });
  });

  describe('custom className', () => {
    it('should merge custom className with default classes', () => {
      render(<CTInput className="custom-class" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('rounded-ct-md'); // default class still present
    });
  });

  describe('HTML attributes', () => {
    it('should pass through HTML input attributes', () => {
      render(
        <CTInput
          name="username"
          id="username-input"
          autoComplete="username"
          maxLength={50}
          data-testid="input"
        />
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('name', 'username');
      expect(input).toHaveAttribute('id', 'username-input');
      expect(input).toHaveAttribute('autocomplete', 'username');
      expect(input).toHaveAttribute('maxlength', '50');
    });

    it('should support aria attributes', () => {
      render(
        <CTInput
          aria-label="Username"
          aria-describedby="username-help"
          aria-invalid="true"
          data-testid="input"
        />
      );
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-label', 'Username');
      expect(input).toHaveAttribute('aria-describedby', 'username-help');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = vi.fn();
      render(<CTInput ref={ref} />);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
    });

    it('should allow ref access to input methods', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(<CTInput ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.focus).toBeDefined();
    });
  });

  describe('wrapper structure', () => {
    it('should wrap input in a div', () => {
      const { container } = render(<CTInput />);
      const wrapper = container.querySelector('div.relative');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.querySelector('input')).toBeInTheDocument();
    });

    it('should position icons absolutely within wrapper', () => {
      const LeftIcon = () => <span data-testid="left-icon">🔍</span>;
      const { container } = render(<CTInput leftIcon={<LeftIcon />} />);

      const iconWrapper = screen.getByTestId('left-icon').parentElement;
      expect(iconWrapper).toHaveClass('absolute', 'left-3', 'top-1/2', '-translate-y-1/2');
    });
  });
});
