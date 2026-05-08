/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        paper: "#f6f7f2",
        moss: "#3f6f52",
        teal: "#005f73",
        coral: "#bd4f3f",
        amber: "#d99a27",
        lilac: "#6d5bd0",
      },
      boxShadow: {
        focus: "0 0 0 3px rgba(0, 95, 115, 0.22)",
      },
    },
  },
  plugins: [],
};
