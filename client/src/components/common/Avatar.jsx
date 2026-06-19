import { useState } from 'react';

const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const getColor = (name) => {
    if (!name) return 'bg-surface-tertiary text-muted';
    const colors = [
      'bg-brand-primary/10 text-brand-primary',
      'bg-brand-secondary/10 text-brand-secondary',
      'bg-brand-gold/10 text-brand-gold',
      'bg-status-success/10 text-status-success',
      'bg-status-info/10 text-status-info',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name || 'User avatar'}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${getColor(name)} rounded-full flex items-center justify-center font-heading font-semibold ${className}`}
      aria-label={name || 'User avatar'}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
