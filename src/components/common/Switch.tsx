
import { useTheme } from '../../context/ThemeContext';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export default function Switch({
    checked,
    onChange,
    label,
    disabled = false,
    className = ''
}: SwitchProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const handleToggle = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    return (
        <div className={`flex items-center ${className}`}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={handleToggle}
                disabled={disabled}
                className={`
                    relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-900 focus:ring-offset-2
                    ${checked ? 'bg-red-900' : 'bg-gray-200'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <span className="sr-only">{label || 'Toggle'}</span>
                <span
                    aria-hidden="true"
                    className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                        transition duration-200 ease-in-out
                        ${checked ? 'translate-x-5' : 'translate-x-0'}
                    `}
                />
            </button>
            {label && (
                <span
                    className={`ml-3 text-sm font-medium select-none cursor-pointer ${disabled ? (isDark ? 'text-gray-500' : 'text-gray-400') : isDark ? 'text-white' : 'text-gray-700'}`}
                    onClick={handleToggle}
                >
                    {label}
                </span>
            )}
        </div>
    );
}
