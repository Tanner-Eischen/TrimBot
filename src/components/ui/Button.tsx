import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

// Button variant types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Button props interface
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  tooltip?: string;
  children?: ReactNode;
}

// Button component
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      tooltip,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    // Combine all classes
    const buttonClasses = [
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      fullWidth ? 'btn--full-width' : '',
      loading ? 'btn--loading' : '',
      disabled ? 'btn--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="btn-loading-spinner"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          style={{ opacity: 0.25 }}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          style={{ opacity: 0.75 }}
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    // Render icon
    const renderIcon = (position: 'left' | 'right') => {
      if (loading && position === 'left') {
        return <LoadingSpinner />;
      }
      
      if (icon && iconPosition === position && !loading) {
        return <span className="flex-shrink-0">{icon}</span>;
      }
      
      return null;
    };

    const buttonContent = (
      <>
        {renderIcon('left')}
        {children && <span className={loading ? 'opacity-70' : ''}>{children}</span>}
        {renderIcon('right')}
      </>
    );

    const buttonElement = (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </button>
    );

    // Wrap with tooltip if provided
    if (tooltip) {
      return (
        <div className="btn-tooltip">
          {buttonElement}
          <div className="btn-tooltip-content">
            {tooltip}
          </div>
        </div>
      );
    }

    return buttonElement;
  }
);

Button.displayName = 'Button';

// Icon button variant
export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', variant = 'ghost', className = '', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size={size}
        variant={variant}
        className={`btn-icon ${className}`}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Button group component
export interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className = '',
  orientation = 'horizontal',
  size,
  variant,
}) => {
  const groupClasses = [
    'btn-group',
    orientation === 'vertical' ? 'btn-group--vertical' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Clone children and apply consistent props
  const clonedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement<ButtonProps>(child) && child.type === Button) {
      return React.cloneElement(child, {
        size: size || child.props.size,
        variant: variant || child.props.variant,
      });
    }
    return child;
  });

  return <div className={groupClasses}>{clonedChildren}</div>;
};

export default Button;