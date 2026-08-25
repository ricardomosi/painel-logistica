import React from 'react';

export const LOGO_LOGIN = 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1761740142/jp-branco-300x181_wheyp9.png';
export const LOGO_COLETAS = 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1772193840/Gemini_Generated_Image_b4mrdzb4mrdzb4mr_1_dacrgw.png';
export const LOGO_ENTREGAS = 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1787453934/JPATRICIO_METAIS-branco_ur3xyt.png';
export const LOGO_ROMANEIO = 'https://res.cloudinary.com/dyw2bm0p4/image/upload/v1772193535/Gemini_Generated_Image_b4mrdzb4mrdzb4mr_1_izinkt.png';

export default function Logo({ 
  variant = 'login', 
  className = "h-12 sm:h-14", 
  alt = "J Patricio Metais" 
}) {
  let src = LOGO_LOGIN;
  if (variant === 'coletas') src = LOGO_COLETAS;
  else if (variant === 'entregas') src = LOGO_ENTREGAS;
  else if (variant === 'romaneio') src = LOGO_ROMANEIO;

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} w-auto object-contain bg-transparent transition-transform duration-200`}
      loading="eager"
    />
  );
}
