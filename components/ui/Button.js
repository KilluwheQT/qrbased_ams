export default function Button({ children, className = '', variant = 'primary', ...props }) {
  const base = 'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 uppercase text-sm tracking-wide';
  const variants = {
    primary: 'gradient-primary text-white px-6 py-3 shadow-lg hover:shadow-xl hover:scale-105',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2',
    danger: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 shadow-md hover:shadow-lg',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2'
  };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
}
