/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    navy: '#0f172a',
                    blue: '#3b82f6',
                    success: '#10b981',
                    warning: '#f59e0b',
                    error: '#f43f5e',
                    light: '#f8fafc',
                }
            }
        },
    },
    plugins: [],
}
