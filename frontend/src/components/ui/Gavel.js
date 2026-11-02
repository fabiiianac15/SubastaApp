import React from 'react';

// Marca propia: el mazo. Se dibuja con trazo de bloque para que aguante tamaños
// pequeños (logo) y enormes (subasta adjudicada).
const Gavel = ({ size = 24, className = '', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden="true" {...props}>
    <g transform="rotate(-42 32 28)">
      <rect x="18" y="8" width="26" height="19" rx="3" />
      <rect x="12" y="4" width="7" height="27" rx="2.5" />
      <rect x="43" y="4" width="7" height="27" rx="2.5" />
      <rect x="27.5" y="27" width="7" height="33" rx="3.5" />
    </g>
    <rect x="3" y="54" width="32" height="7" rx="3.5" />
  </svg>
);

export const Logo = ({ withText = true }) => (
  <span className="logo">
    <span className="logo__mark">
      <Gavel size={22} />
    </span>
    {withText && <span className="logo__text display">Subastapp</span>}
  </span>
);

export default Gavel;
