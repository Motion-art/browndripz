module.exports = {
  content: ["./pages/*.{html,js}", "./index.html", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: "#050506", // Deep authority, premium foundation
        secondary: "#1a1a1c", // Sophisticated depth, content separation  
        accent: "#8C6E4B", // Selective emphasis, premium moments
        background: "#fafafa", // Clean canvas, optimal readability
        surface: "#f5f5f5", // Subtle elevation, card backgrounds
        text: {
          primary: "#1a1a1c", // Extended reading, clear hierarchy
          secondary: "#666666", // Supporting information, reduced emphasis
        },
        success: "#2d5a27", // Understated confirmation, trust building
        warning: "#8b5a2b", // Gentle urgency, helpful guidance
        error: "#7a2e2e", // Concerned assistance, problem solving
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        inter: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      fontWeight: {
        'playfair-regular': '400',
        'playfair-semibold': '600', 
        'playfair-bold': '700',
        'inter-regular': '400',
        'inter-medium': '500',
        'inter-semibold': '600',
      },
      boxShadow: {
        'premium': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.06)',
        'subtle': '0 1px 8px rgba(0, 0, 0, 0.04)',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        '300': '300ms',
        '400': '400ms',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderWidth: {
        '1': '1px',
      },
      animation: {
        'fade-in': 'fadeIn 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slideUp 400ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}