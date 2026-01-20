import { useMemo, forwardRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    type ChartData,
    type ChartOptions
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import type { ReporteData } from '../../types/reporteStats';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

interface ReporteChartProps {
    data: ReporteData;
}

const ReporteChart = forwardRef<ChartJS, ReporteChartProps>(({ data }, ref) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Let TS infer the type or use generic ChartData to avoid union conflicts
    const chartData = useMemo(() => {
        // Palette for charts
        const backgroundColors = [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)',
            'rgba(40, 159, 64, 0.6)',
            'rgba(210, 99, 132, 0.6)',
            'rgba(90, 162, 235, 0.6)',
            'rgba(200, 206, 86, 0.6)',
            'rgba(100, 192, 192, 0.6)',
        ];

        // Cycle through colors
        const bg = data.labels.map((_, i) => backgroundColors[i % backgroundColors.length]);
        const border = bg.map(c => c.replace('0.6)', '1)'));

        return {
            labels: data.labels,
            datasets: [
                {
                    label: data.datasetLabel,
                    data: data.values,
                    backgroundColor: bg,
                    borderColor: border,
                    borderWidth: 1,
                },
            ],
        };
    }, [data]);

    const pluginOptions = {
        legend: {
            position: 'bottom' as const,
            labels: {
                color: isDark ? '#e5e7eb' : '#374151'
            }
        },
        title: {
            display: true,
            text: data.datasetLabel,
            color: isDark ? '#e5e7eb' : '#111827',
            font: { size: 16, weight: 'bold' as const }
        },
        tooltip: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            titleColor: isDark ? '#fff' : '#000',
            bodyColor: isDark ? '#fff' : '#000',
            borderColor: isDark ? '#374151' : '#e5e7eb',
            borderWidth: 1
        }
    };

    // --- Horizontal Bar Logic (Parroquias) ---
    if (data.chartType === 'horizontalBar') {
        const itemHeight = 35; // Pixels per bar
        const minHeight = 400;
        const calculatedHeight = Math.max(minHeight, data.labels.length * itemHeight);

        const horizontalOptions: ChartOptions<'bar'> = {
            responsive: true,
            plugins: pluginOptions,
            indexAxis: 'y', // CRITICAL for horizontal
            maintainAspectRatio: false, // CRITICAL for dynamic height
            scales: {
                x: {
                    grid: { color: isDark ? '#374151' : '#e5e7eb' },
                    ticks: { color: isDark ? '#9ca3af' : '#4b5563' }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        color: isDark ? '#d1d5db' : '#1f2937',
                        autoSkip: false // Ensure all labels are shown
                    }
                }
            }
        };

        return (
            <div style={{ height: `${calculatedHeight}px`, width: '100%', position: 'relative' }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Bar
                    ref={ref as any}
                    data={chartData as ChartData<'bar'>}
                    options={horizontalOptions}
                />
            </div>
        );
    }

    // --- Pie Chart ---
    if (data.chartType === 'pie') {
        const pieOptions: ChartOptions<'pie'> = {
            responsive: true,
            plugins: pluginOptions,
            maintainAspectRatio: false,
        };
        return (
            <div style={{ height: '400px', width: '100%', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Pie
                    ref={ref as any}
                    data={chartData as ChartData<'pie'>}
                    options={pieOptions}
                />
            </div>
        );
    }

    // --- Vertical Bar (Default) ---
    const verticalOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: pluginOptions,
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: isDark ? '#9ca3af' : '#4b5563' }
            },
            y: {
                grid: { color: isDark ? '#374151' : '#e5e7eb' },
                ticks: { color: isDark ? '#9ca3af' : '#4b5563' }
            }
        }
    };

    return (
        <div style={{ height: '400px', width: '100%', position: 'relative' }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Bar
                ref={ref as any}
                data={chartData as ChartData<'bar'>}
                options={verticalOptions}
            />
        </div>
    );
});

export default ReporteChart;
