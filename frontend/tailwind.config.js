/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./src/**/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {},
      colors: {},
      animation: {
        fadeIn: "fadeIn 0.5s ease-out forwards",
        pulseOnce: "pulseOnce 0.5s ease-in-out",
        spinOnce: "spinOnce 0.7s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseOnce: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        spinOnce: {
          to: { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
