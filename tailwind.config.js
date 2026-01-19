/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Habilitar dark mode usando clases
    theme: {
        extend: {
            zIndex: {
                '9999': '9999',
            }
        },
    },
    plugins: [],
}
