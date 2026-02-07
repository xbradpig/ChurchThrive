import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CTButton } from '@/components/atoms/CTButton';

describe('CTButton', () => {
  describe('rendering', () => {
    it('should render with children', () => {
      render(<CTButton>Click me</CTButton>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should apply default variant (primary)', () => {
      render(<CTButton>Button</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ct-primary');
    });

    it('should apply default size (md)', () => {
      render(<CTButton>Button</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-4', 'text-ct-md');
    });
  });

  describe('variants', () => {
    it('should render primary variant', () => {
      render(<CTButton variant="primary">Primary</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ct-primary', 'text-white');
    });

    it('should render secondary variant', () => {
      render(<CTButton variant="secondary">Secondary</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ct-sky', 'text-white');
    });

    it('should render outline variant', () => {
      render(<CTButton variant="outline">Outline</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'border-ct-primary', 'text-ct-primary');
    });

    it('should render ghost variant', () => {
      render(<CTButton variant="ghost">Ghost</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-[var(--ct-color-text-primary)]');
    });

    it('should render danger variant', () => {
      render(<CTButton variant="danger">Danger</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-ct-error', 'text-white');
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      render(<CTButton size="sm">Small</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-3', 'text-ct-sm');
    });

    it('should render medium size', () => {
      render(<CTButton size="md">Medium</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-4', 'text-ct-md');
    });

    it('should render large size', () => {
      render(<CTButton size="lg">Large</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'px-6', 'text-ct-lg');
    });
  });

  describe('states', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<CTButton disabled>Disabled</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-60', 'disabled:cursor-not-allowed');
    });

    it('should be disabled when isLoading is true', () => {
      render(<CTButton isLoading>Loading</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show loading spinner when isLoading is true', () => {
      render(<CTButton isLoading>Loading</CTButton>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show children when isLoading is true', () => {
      render(<CTButton isLoading>Click me</CTButton>);
      expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('should render left icon', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      render(
        <CTButton leftIcon={<LeftIcon />}>
          With Left Icon
        </CTButton>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(
        <CTButton rightIcon={<RightIcon />}>
          With Right Icon
        </CTButton>
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render both left and right icons', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      const RightIcon = () => <span data-testid="right-icon">→</span>;
      render(
        <CTButton leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          With Icons
        </CTButton>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should not render icons when isLoading', () => {
      const LeftIcon = () => <span data-testid="left-icon">←</span>;
      render(
        <CTButton isLoading leftIcon={<LeftIcon />}>
          Loading
        </CTButton>
      );
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<CTButton onClick={handleClick}>Click me</CTButton>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<CTButton disabled onClick={handleClick}>Click me</CTButton>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when isLoading', () => {
      const handleClick = vi.fn();
      render(<CTButton isLoading onClick={handleClick}>Click me</CTButton>);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('fullWidth', () => {
    it('should apply full width class when fullWidth is true', () => {
      render(<CTButton fullWidth>Full Width</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('should not apply full width class by default', () => {
      render(<CTButton>Not Full Width</CTButton>);
      const button = screen.getByRole('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('custom className', () => {
    it('should merge custom className with default classes', () => {
      render(<CTButton className="custom-class">Button</CTButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('bg-ct-primary'); // default class still present
    });
  });

  describe('HTML attributes', () => {
    it('should pass through HTML button attributes', () => {
      render(
        <CTButton type="submit" name="submit-button" data-testid="test-button">
          Submit
        </CTButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-button');
      expect(button).toHaveAttribute('data-testid', 'test-button');
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = vi.fn();
      render(<CTButton ref={ref}>Button</CTButton>);
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
