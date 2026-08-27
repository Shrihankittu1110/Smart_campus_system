// Theme configuration with green color palette
export const theme = {
  light: {
    colors: {
      primary: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e', // Primary green
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
      },
      secondary: {
        // You can add secondary colors here
      },
      background: {
        primary: '#ffffff',
        secondary: '#f9fafb',
        tertiary: '#f3f4f6',
      },
      text: {
        primary: '#111827',
        secondary: '#4b5563',
        tertiary: '#9ca3af',
        inverse: '#ffffff',
      },
      border: {
        light: '#e5e7eb',
        default: '#d1d5db',
        dark: '#9ca3af',
      },
      status: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
  },
  dark: {
    colors: {
      primary: {
        50: '#052e16',
        100: '#0a3b1e',
        200: '#0f4d26',
        300: '#166534',
        400: '#15803d',
        500: '#16a34a', // Slightly brighter for dark mode
        600: '#22c55e',
        700: '#4ade80',
        800: '#86efac',
        900: '#bbf7d0',
      },
      background: {
        primary: '#111827',
        secondary: '#1f2937',
        tertiary: '#374151',
      },
      text: {
        primary: '#f9fafb',
        secondary: '#e5e7eb',
        tertiary: '#9ca3af',
        inverse: '#111827',
      },
      border: {
        light: '#374151',
        default: '#4b5563',
        dark: '#6b7280',
      },
      status: {
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
    },
  },
};