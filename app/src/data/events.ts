export const EVENTS = [
  {
    id: 'vincent-country',
    title: 'Vincent Country Community Event',
    description:
      "Coverage from the Vincent Country Community Event with NFL Executive & Former Player Troy Vincent.",
    images: [
      '/Vincent Country Community Event/6363A555-5876-4F69-960D-6A0D6DC5756E.jpg',
      '/Vincent Country Community Event/6486642B-72B4-4E55-B0B0-E2AED370FCF7.jpg',
      '/Vincent Country Community Event/95280CF9-D7FC-4245-9B0B-2D6AC194BAF6.jpg',
    ],
  },
  {
    id: 'rmh',
    title: 'Ronald McDonald House Charities',
    description:
      'The Impact of Ronald McDonald House with Marnie Schneider & CEO Grace McIntosh.',
    images: [
      '/RMH Event/rmh2.png',
      '/RMH Event/IMG_8595.PNG',
      '/RMH Event/F1793232-1BA8-41C6-BD1C-5727EFCA5B80.jpeg',
      '/RMH Event/IMG_2562.png',
      '/RMH Event/IMG_8597.png',
      '/RMH Event/IMG_8600.png',
      '/RMH Event/IMG_8610.png',
      '/RMH Event/IMG_8614.png',
      '/RMH Event/IMG_8616.png',
      '/RMH Event/IMG_8617.png',
      '/RMH Event/IMG_8622.png',
      '/RMH Event/IMG_8640.png',
      '/RMH Event/IMG_8643.png',
      '/RMH Event/rmh1.png',
    ],
  },
] as const;

export type EventId = (typeof EVENTS)[number]['id'];
