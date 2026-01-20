import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
    size?: 'sm' | 'md' | 'lg';
    icon?: IconDefinition;
    isLoading?: boolean;
    children?: React.ReactNode;
    isDark?: boolean;
}

const Button = ({
    variant = 'primary',
    size = 'md',
    icon,
    isLoading = false,
    children,
    className = "",
    disabled,
    isDark = false,
    ...props
}: ButtonProps) => {

    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-red-900 text-white hover:bg-red-800 focus:ring-red-900 border border-transparent shadow-sm",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 border border-transparent",
        outline: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-red-900",
        ghost: isDark 
            ? "bg-transparent text-gray-200 hover:bg-red-800/50 hover:text-white focus:ring-gray-500" 
            : "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500",
        danger: "bg-white text-red-900 border border-red-200 hover:bg-red-50 focus:ring-red-900",
        link: "text-red-900 hover:underline px-0 py-0 h-auto font-medium"
    };

    const sizes = {
        sm: "px-3 h-8 text-xs",
        md: "px-4 h-10 text-sm",
        lg: "px-6 h-12 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {!isLoading && icon && <FontAwesomeIcon icon={icon} className={children ? "mr-2" : ""} />}
            {children}
        </button>
    );
};

export default Button;
