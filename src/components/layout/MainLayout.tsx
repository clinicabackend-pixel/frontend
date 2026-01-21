import { useState } from 'react';
import type { ReactNode } from 'react';
import Header from '../Header';
import Sidebar from '../Sidebar';
import { useTheme } from '../../context/ThemeContext';

interface MainLayoutProps {
    title: string;
    children: ReactNode;
    className?: string;
}

function MainLayout({ title, children, className = '' }: MainLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const handleMenuClick = () => {
        setIsSidebarOpen(true);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
    };


    return (
        <div className={`flex w-screen h-screen overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Sidebar is now a direct child of the flex container (on desktop) */}
            <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

            {/* Content Wrapper */}
            <div className={`flex-1 flex flex-col w-full min-w-0 transition-all duration-300 ${isDark ? 'bg-gray-900' : ''}`}>
                <Header title={title} onMenuClick={handleMenuClick} />

                <main
                    className={`flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6 lg:px-10 lg:py-8 ${isDark ? 'bg-gray-900' : ''} ${className}`}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
