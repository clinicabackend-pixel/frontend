import type { ChangeEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

interface CustomInputProps {
    label?: React.ReactNode;
    name: string;
    value: string | number;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    type?: 'text' | 'number' | 'password' | 'email' | 'tel';
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    maxLength?: number;
    pattern?: string;
    title?: string;
    className?: string;
    isDark?: boolean;
}

export default function CustomInput({
    label,
    name,
    value,
    onChange,
    type = 'text',
    placeholder,
    disabled = false,
    required = false,
    min,
    max,
    step,
    maxLength,
    pattern,
    title,
    className = '',
    isDark = false
}: CustomInputProps) {
    const handleIncrement = () => {
        if (disabled) return;
        const currentValue = Number(value || 0);
        const nextValue = currentValue + (step || 1);
        if (max !== undefined && nextValue > max) return;

        const event = {
            target: {
                name,
                value: nextValue.toString(),
                type: type
            }
        } as ChangeEvent<HTMLInputElement>;

        onChange(event);
    };

    const handleDecrement = () => {
        if (disabled) return;
        const currentValue = Number(value || 0);
        const nextValue = currentValue - (step || 1);
        if (min !== undefined && nextValue < min) return;
        if (min === undefined && nextValue < 0) return;

        const event = {
            target: {
                name,
                value: nextValue.toString(),
                type: type
            }
        } as ChangeEvent<HTMLInputElement>;

        onChange(event);
    };

    return (
        <div className={`flex flex-col ${className}`}>
            {label && (
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                    {label}
                </label>
            )}

            {type === 'number' ? (
                <div className={`
                    relative flex items-center w-full border rounded-full px-4 py-2 shadow-sm
                    focus-within:ring-2 focus-within:ring-red-900 focus-within:border-transparent
                    transition-all duration-200
                    bg-white border-gray-300 ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-red-900'}
                `}>
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        min={min !== undefined ? min : 0}
                        max={max}
                        step={step}
                        className="flex-1 bg-transparent border-none outline-none w-full appearance-none m-0 p-0 text-gray-900 placeholder-gray-400"
                        style={{
                            appearance: 'textfield',
                            MozAppearance: 'textfield',
                        }}
                    />

                    <style>{`
                        input[type=number]::-webkit-inner-spin-button, 
                        input[type=number]::-webkit-outer-spin-button { 
                            -webkit-appearance: none; 
                            margin: 0; 
                        }
                    `}</style>

                    <div className="flex items-center gap-2 ml-3">
                        <button
                            type="button"
                            onClick={handleDecrement}
                            disabled={disabled || (min !== undefined ? Number(value) <= min : Number(value) <= 0)}
                            className={`
                                w-8 h-8 flex items-center justify-center rounded-full border transition-colors
                                ${disabled || (Number(value) <= (min ?? 0))
                                    ? 'border-gray-300 text-gray-300 cursor-not-allowed'
                                    : 'border-gray-400 text-gray-600 hover:border-red-900 hover:text-red-900 bg-white hover:bg-red-50'
                                }
                            `}
                        >
                            <FontAwesomeIcon icon={faMinus} size="sm" />
                        </button>

                        <button
                            type="button"
                            onClick={handleIncrement}
                            disabled={disabled || (max !== undefined && Number(value) >= max)}
                            className={`
                                w-8 h-8 flex items-center justify-center rounded-full border transition-colors
                                ${disabled || (max !== undefined && Number(value) >= max)
                                    ? 'border-gray-300 text-gray-300 cursor-not-allowed'
                                    : 'border-gray-400 text-gray-600 hover:border-red-900 hover:text-red-900 bg-white hover:bg-red-50'
                                }
                            `}
                        >
                            <FontAwesomeIcon icon={faPlus} size="sm" />
                        </button>
                    </div>
                </div>
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    maxLength={maxLength}
                    pattern={pattern}
                    title={title}
                    className={`
                        w-full px-4 h-11 border rounded-lg shadow-sm
                        outline-none transition-all duration-200
                        focus:ring-2 focus:ring-red-900 focus:border-transparent
                        bg-white border-gray-300 placeholder-gray-400 text-gray-900 hover:border-red-900 ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''}
                    `}
                />
            )}
        </div>
    );
}
