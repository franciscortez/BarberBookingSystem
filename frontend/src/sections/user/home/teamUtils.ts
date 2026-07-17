export const getBarberVisuals = (name: string) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('marco')) {
    return {
      initials: 'MR',
      specialty: 'Master Barber & Style Architect',
      bio: 'With over 15 years of experience, Marco specializes in classic architectural cuts and precision beard sculpting. He is the heartbeat of our grooming sanctuary.'
    };
  } else if (lowercaseName.includes('luis')) {
    return {
      initials: 'LS',
      specialty: 'Professional Grooming Artist',
      bio: 'Luis is an expert in modern fades and contemporary styling. His attention to detail and sharp finishes make him a favorite for sharp, clean looks.'
    };
  } else if (lowercaseName.includes('kevin')) {
    return {
      initials: 'KC',
      specialty: 'Precision Stylist & Shave Master',
      bio: 'Kevin focuses on the art of the traditional straight razor and restorative scalp treatments. He brings a creative, modern touch to every chair.'
    };
  } else {
    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return {
      initials,
      specialty: 'Professional Grooming Artist',
      bio: 'Dedicated to precision crafting and providing a luxury styling experience tailored to your unique profile.'
    };
  }
};
