/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#0f172a", // Slate 900
                secondary: "#1e293b", // Slate 800
                accent: "#3b82f6", // Blue 500
                background: "#f8fafc", // Slate 50
                surface: "#ffffff",
                text: "#334155", // Slate 700
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
