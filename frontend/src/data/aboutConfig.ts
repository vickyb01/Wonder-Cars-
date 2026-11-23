export interface OwnerInfo {
  name: string;
  designation: string;
  tagline: string;
  image: string;
  experienceYears: string;
  bioParagraphs: string[];
  philosophy: string;
  signatureText: string;
}

export interface CompanyPillar {
  title: string;
  subtitle: string;
  description: string;
  iconName: 'ShieldCheck' | 'Compass' | 'Award' | 'HeartHandshake' | 'Target' | 'Sparkles';
}

export interface WhyChooseItem {
  id: string;
  title: string;
  highlight: string;
  description: string;
  badge: string;
  iconName: 'CheckCircle2' | 'Scale' | 'FileCheck' | 'UserCheck' | 'Car' | 'ShieldAlert';
}

export interface CertificateItem {
  id: string;
  title: string;
  authority: string;
  date: string;
  description: string;
  badge: string;
  image: string;
  isPlaceholder?: boolean;
}

export interface GalleryPhotoItem {
  id: string;
  title: string;
  category: 'Showroom' | 'Premium Fleet' | 'Deliveries';
  image: string;
  caption: string;
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  duration: string;
  category: string;
  thumbnailUrl: string;
  autoPlayLive?: boolean;
}

export interface InstagramReelItem {
  id: string;
  url: string;
  shortcode: string;
  title: string;
  category: string;
}

export interface CustomerExperienceItem {
  id: string;
  customerName: string;
  carPurchased: string;
  city: string;
  deliveryDate: string;
  rating: number;
  review: string;
  image?: string;
}

export interface AboutConfig {
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    stats: Array<{ number: string; label: string }>;
  };
  owner: OwnerInfo;
  aboutCompany: {
    badge: string;
    title: string;
    description: string;
    pillars: CompanyPillar[];
  };
  whyChooseUs: {
    badge: string;
    title: string;
    description: string;
    items: WhyChooseItem[];
  };
  certificates: {
    badge: string;
    title: string;
    description: string;
    items: CertificateItem[];
  };
  gallery: {
    badge: string;
    title: string;
    description: string;
    categories: Array<'All' | 'Showroom' | 'Premium Fleet' | 'Deliveries'>;
    items: GalleryPhotoItem[];
  };
  videos: {
    badge: string;
    title: string;
    description: string;
    channelUrl: string;
    items: YouTubeVideoItem[];
  };
  instagramReels: {
    badge: string;
    title: string;
    description: string;
    profileUrl: string;
    items: InstagramReelItem[];
  };
  customerStories: {
    badge: string;
    title: string;
    description: string;
    googleReviewUrl: string;
    averageRating: string;
    totalReviews: string;
    items: CustomerExperienceItem[];
  };
  social: {
    instagram: {
      handle: string;
      url: string;
      followers: string;
      bio: string;
    };
    facebook: {
      pageName: string;
      url: string;
      likes: string;
      bio: string;
    };
    youtube: {
      channelName: string;
      url: string;
      subscribers: string;
      bio: string;
    };
  };
  showroom: {
    name: string;
    address: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    displayPhone: string;
    whatsapp: string;
    email: string;
    openingHours: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    googleMapsPlaceUrl?: string;
    googleMapsEmbedUrl: string;
    googleMapsDirectionsUrl: string;
  };
}

export const ABOUT_DATA: AboutConfig = {
  hero: {
    badge: 'Welcome to Wonder Cars',
    headline: 'More Than Cars, We Build Trust.',
    subheadline:
      'Wonder Cars is Delhi-NCR’s premier destination for curated, certified pre-owned luxury and performance automobiles. Founded with an uncompromising commitment to vehicle provenance, forensic quality audits, and transparent customer relationships.',
    stats: [
      { number: '100%', label: 'Certified Pre-Owned' },
      { number: '210-Point', label: 'Forensic Quality Audit' },
      { number: '6-Month', label: 'Assured Warranty' },
      { number: '1000+', label: 'Delighted Car Owners' },
    ],
  },

  owner: {
    name: 'Naman Jain',
    designation: 'Founder & Dealership Principal',
    tagline: 'Passionate Automotive Specialist & Curator of Delhi-NCR’s Finest Pre-Owned Cars',
    image: '/assets/wonder-cars-emblem-clean.png', // Easily replace with actual owner portrait photo e.g. '/assets/owner-naman-jain.jpg'
    experienceYears: '10+ Years in Automotive Curation',
    bioParagraphs: [
      'Welcome to Wonder Cars. When I set out to establish this dealership, my goal was clear: transform the pre-owned automobile buying experience into one characterized by total transparency, genuine excitement, and lasting trust.',
      'Having been an automotive enthusiast and collector for over a decade, I understand the anxiety that often accompanies buying a second-hand car. That is why at Wonder Cars, every single car in our inventory is hand-picked, non-accidental, meter-verified, and subjected to a comprehensive 210-point mechanical and cosmetic audit before it ever touches our showroom floor.',
      'When you step into our Preet Vihar showroom, you are not just purchasing a vehicle—you are welcoming our dealership into your automotive journey. We look forward to handing you the keys to your dream car.',
    ],
    philosophy: '“A reputation takes decades to build and seconds to compromise. That is why we treat every client like family and every car like our own.”',
    signatureText: 'Naman Jain',
  },

  aboutCompany: {
    badge: 'Our Foundation',
    title: 'The Story Behind Wonder Cars',
    description:
      'Established in East Delhi, Wonder Cars has grown into Delhi-NCR’s most trusted automotive dealership, driven by a client-first philosophy and obsessive mechanical standards.',
    pillars: [
      {
        title: 'Who We Are',
        subtitle: 'Automotive Curators',
        description:
          'A specialized team of vehicle evaluators, master technicians, and client concierges dedicated to sourcing and preparing only the highest-calibre pre-owned cars.',
        iconName: 'Compass',
      },
      {
        title: 'Our Mission',
        subtitle: 'Frictionless Ownership',
        description:
          'To eradicate uncertainty from the pre-owned car market by providing forensic vehicle documentation, zero hidden fees, and end-to-end RTO clearance.',
        iconName: 'Target',
      },
      {
        title: 'Our Vision',
        subtitle: 'The Gold Standard',
        description:
          'To be recognized across India as the gold benchmark in luxury and performance pre-owned vehicle dealerships, celebrated for honesty and exceptional post-sale support.',
        iconName: 'Award',
      },
      {
        title: 'Our Values',
        subtitle: 'Integrity in Every Deal',
        description:
          'Transparency, safety, authenticity, and enduring customer relationships form the bedrock of every car delivery at Wonder Cars.',
        iconName: 'HeartHandshake',
      },
      {
        title: 'Our Quality Promise',
        subtitle: 'Strict Selection Ratio',
        description:
          'We evaluate dozens of vehicles weekly, but accept fewer than 10% into our showroom. Only non-accidental, clean-title automobiles qualify.',
        iconName: 'ShieldCheck',
      },
      {
        title: 'Customer Commitment',
        subtitle: 'Lifelong Support',
        description:
          'Our relationship continues long after delivery day. We provide assured 6-month warranties, guaranteed buyback assistance, and private maintenance concierge.',
        iconName: 'Sparkles',
      },
    ],
  },

  whyChooseUs: {
    badge: 'The Wonder Advantage',
    title: 'Why Discerning Buyers Choose Wonder Cars',
    description:
      'From forensic mechanical diagnostics to seamless state-wide RC transfers, see what makes our buying experience second to none.',
    items: [
      {
        id: 'w1',
        title: 'Quality Checked Vehicles',
        highlight: '210-Point Forensic Audit',
        description:
          'Digital paint depth measurement, OBD diagnostic scans, suspension health checks, and engine compression telemetry on every car.',
        badge: 'Inspected & Certified',
        iconName: 'CheckCircle2',
      },
      {
        id: 'w2',
        title: 'Transparent Pricing',
        highlight: 'Zero Hidden Charges',
        description:
          'Direct INR price quotes with complete breakdown of taxes, registration transfer, and warranty package. What you see is what you pay.',
        badge: '100% Fixed INR Quotes',
        iconName: 'Scale',
      },
      {
        id: 'w3',
        title: 'Verified Documentation',
        highlight: 'Clear Title Guarantee',
        description:
          'Full legal provenance review: NCRP clearance, single-owner history verification, insurance claim scrutiny, and seamless state RC transfer.',
        badge: 'NOC & RC Cleared',
        iconName: 'FileCheck',
      },
      {
        id: 'w4',
        title: 'Customer-Focused Service',
        highlight: 'Private Concierge Care',
        description:
          'Private showroom viewings, doorstep test drives across Delhi-NCR, custom financing options, and tailored vehicle handover ceremonies.',
        badge: 'Doorstep Test Drive',
        iconName: 'UserCheck',
      },
      {
        id: 'w5',
        title: 'Wide Range of Pre-Owned Cars',
        highlight: 'Curated Fleet Portfolio',
        description:
          'From sporty sedans and executive grand tourers to high-performance SUVs and luxury electric vehicles, our fleet caters to all driving desires.',
        badge: 'Multibrand Excellence',
        iconName: 'Car',
      },
      {
        id: 'w6',
        title: 'Trusted Buying Experience',
        highlight: '6-Month Assured Warranty',
        description:
          'Every vehicle is protected by our comprehensive 6-month engine and transmission coverage, offering total peace of mind on the road.',
        badge: '6-Month Assured Warranty',
        iconName: 'ShieldAlert',
      },
    ],
  },

  certificates: {
    badge: 'Verified & Certified',
    title: 'Dealership Certifications & Credentials',
    description:
      'Wonder Cars operates under strict automotive industry compliance, certified inspection standards, and authorized business registration.',
    items: [
      {
        id: 'c1',
        title: 'Droom Certificate of Excellence · Winner 2024–25',
        authority: 'Droom Technology · Sandeep Aggarwal (Founder & CEO)',
        date: 'Winner 2024–25 · Rated 4.3 ★',
        description:
          'Awarded to WONDER CARS for outstanding pre-owned automobile sales excellence, verified pricing transparency, and superior customer rating of 4.3 based on Droom proprietary methodology.',
        badge: 'Droom Excellence Winner',
        image: '/assets/certificates/droom-excellence-certificate.jpg',
        isPlaceholder: false,
      },
      {
        id: 'c2',
        title: 'CarDekho Certificate of Association',
        authority: 'CarDekho Certified Automotive Dealer Network',
        date: 'Authorized Partner Dealer',
        description:
          'Official Certificate of Association recognizing WONDER CARS as an accredited CarDekho Partner Dealer meeting rigorous customer trust and multi-point vehicle standards.',
        badge: 'CarDekho Partner Dealer',
        image: '/assets/certificates/cardekho-partner-certificate.jpg',
        isPlaceholder: false,
      },
      {
        id: 'c3',
        title: 'OLX Autos Certificate of Recognition',
        authority: 'OLX Auto India · Amit Kumar (Head - OLX Auto India)',
        date: 'Valuable Dealer Partner',
        description:
          'Awarded to WONDER CARS for being a Valuable Dealer Partner at OLX Autos, recognizing leadership and excellence in the certified used car marketplace.',
        badge: 'OLX Autos Partner',
        image: '/assets/certificates/olx-autos-recognition-certificate.jpg',
        isPlaceholder: false,
      },
    ],
  },

  gallery: {
    badge: 'Our Atmosphere',
    title: 'Showroom, Fleet & Delivery Moments',
    description:
      'Take a visual tour inside our Preet Vihar showroom, inspect our pristine pre-owned fleet, and witness unforgettable vehicle delivery celebrations.',
    categories: ['All', 'Showroom', 'Premium Fleet', 'Deliveries'],
    items: [
      {
        id: 'g1',
        title: 'Showroom Showcase & Vehicle Display',
        category: 'Showroom',
        image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.12.29%20AM.jpeg',
        caption: 'Premium vehicle showcase and architectural display at our East Delhi showroom.',
      },
      {
        id: 'g2',
        title: 'Certified Pre-Owned Fleet Lineup',
        category: 'Premium Fleet',
        image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.12.46%20AM.jpeg',
        caption: 'Curated selection of verified second-hand luxury vehicles ready for inspection.',
      },
      {
        id: 'g3',
        title: 'Showroom Floor & Presentation Zone',
        category: 'Showroom',
        image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.13.08%20AM.jpeg',
        caption: 'Pristine detailing and lighting inside our climate-controlled showroom.',
      },
      {
        id: 'g4',
        title: 'Customer Vehicle Delivery Moment',
        category: 'Deliveries',
        image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.13.27%20AM.jpeg',
        caption: 'Key handover celebration with verified documents and celebratory ceremony.',
      },
      {
        id: 'g5',
        title: 'Luxury Fleet Inspection & Detailing',
        category: 'Premium Fleet',
        image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.14.13%20AM.jpeg',
        caption: 'Forensic evaluation and multi-point quality check of incoming vehicles.',
      },
      {
        id: 'g6',
        title: 'Dealership Atmosphere & Customer Lounge',
        category: 'Showroom',
        image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.16.23%20AM.jpeg',
        caption: 'Transparent consultation space and customer relationship lounge.',
      },
      {
        id: 'g7',
        title: 'Happy Family Vehicle Delivery',
        category: 'Deliveries',
        image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.17.09%20AM.jpeg',
        caption: 'Milestone delivery ceremony celebrating another happy car owner.',
      },
      {
        id: 'g8',
        title: 'Second-Hand Luxury Car Collection',
        category: 'Premium Fleet',
        image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.21.08%20AM.jpeg',
        caption: 'Handpicked certified luxury cars prepared for their next long journey.',
      },
      {
        id: 'g9',
        title: 'Delighted Customer Car Delivery & Celebration',
        category: 'Deliveries',
        image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-19%20at%202.44.20%20PM.jpeg',
        caption: 'Celebrating another proud car owner taking delivery from Wonder Cars.',
      },
    ],
  },

  videos: {
    badge: 'Watch Our Journey',
    title: 'Experience Wonder Cars in Motion',
    description:
      'Watch our comprehensive showroom tours, detailed car inspections, client vehicle deliveries, and automotive highlights.',
    channelUrl: 'https://youtube.com/@usedcarsnearby?si=rLhUh-H6HIdMfBQ5',
    items: [
      {
        id: 'v1',
        title: 'Mahindra Scorpio 2021 😱😱 — Price, Specs & Walkaround',
        description:
          'Detailed walkthrough, condition inspection, price breakdown and features of Mahindra Scorpio 2021 by Used Cars Nearby.',
        youtubeId: 'lBqEQDq77ow',
        duration: 'Walkaround',
        category: 'Featured Walkaround',
        thumbnailUrl: 'https://img.youtube.com/vi/lBqEQDq77ow/hqdefault.jpg',
        autoPlayLive: true,
      },
      {
        id: 'v2',
        title: 'Mahindra Thar 2020 😱 || Thar Modified — Best Used Cars in Delhi',
        description:
          'Modified Mahindra Thar 2020 walkaround, condition review, pricing and off-road highlights by Used Cars Nearby.',
        youtubeId: 'jRXJxQMl4TM',
        duration: 'Walkaround',
        category: 'Modified 4x4',
        thumbnailUrl: 'https://img.youtube.com/vi/jRXJxQMl4TM/hqdefault.jpg',
        autoPlayLive: true,
      },
      {
        id: 'v3',
        title: 'Best Luxury SUV Under Budget? | BMW X1 Detailed Review & Price',
        description:
          'Complete condition walkthrough, luxury features, inspection telemetry, and price breakdown by Used Cars Nearby.',
        youtubeId: 'lgfRr3RF2IY',
        duration: 'Buyer Guide',
        category: 'Buyer Guide',
        thumbnailUrl: 'https://img.youtube.com/vi/lgfRr3RF2IY/hqdefault.jpg',
        autoPlayLive: true,
      },
    ],
  },

  instagramReels: {
    badge: 'Trending on Instagram',
    title: 'Watch Us on Instagram Reels',
    description:
      'Catch our latest pre-owned luxury car deliveries, condition walkthroughs, and special deals updated daily on @usedcarsnearby.',
    profileUrl: 'https://www.instagram.com/usedcarsnearby?fqnt=MWdxdjZndW4zNHkwNQ%3D%3D',
    items: [
      {
        id: 'ig-1',
        url: 'https://www.instagram.com/p/DfzpL1GhlWF/',
        shortcode: 'DfzpL1GhlWF',
        title: 'Exclusive Walkaround & New Arrival Reel',
        category: 'Instagram Reel',
      },
      {
        id: 'ig-2',
        url: 'https://www.instagram.com/p/Da0HwEHBqdl/',
        shortcode: 'Da0HwEHBqdl',
        title: 'Luxury Pre-Owned Special Feature Reel',
        category: 'Instagram Reel',
      },
      {
        id: 'ig-3',
        url: 'https://www.instagram.com/p/Db3WWGKhBON/',
        shortcode: 'Db3WWGKhBON',
        title: 'Showroom Spotlight & Client Moments Reel',
        category: 'Instagram Reel',
      },
    ],
  },

  customerStories: {
    badge: 'Delighted Clients',
    title: 'Real Stories from Wonder Cars Owners',
    description:
      'We measure our success by the satisfaction, confidence, and peace of mind our car owners enjoy across Delhi-NCR and beyond.',
    googleReviewUrl:
      'https://www.google.com/maps/place/Wonder+cars/@28.6396962,77.2910558,17z/data=!3m1!4b1!4m6!3m5!1s0x390cfbb6c71185b3:0x518ca5e40932dc6d!8m2!3d28.6396915!4d77.2936307!16s%2Fg%2F11z4164dfg',
    averageRating: '4.9',
    totalReviews: '120+ Verified Reviews',
    items: [
      {
        id: 'r1',
        customerName: 'Rohit Malhotra',
        carPurchased: '2022 BMW M340i xDrive',
        city: 'South Delhi',
        deliveryDate: 'October 2026',
        rating: 5,
        review:
          'Naman ji and the Wonder Cars team made the entire purchase remarkably smooth. The car was detailed like brand new, every service record was authentic, and RC transfer happened in just 4 days.',
        image: '/src/assets/images/car_bmw_m4_1794898129243.jpg',
      },
      {
        id: 'r2',
        customerName: 'Dr. Priya Aggarwal',
        carPurchased: '2021 Mercedes-Benz E-Class E200',
        city: 'Noida, NCR',
        deliveryDate: 'September 2026',
        rating: 5,
        review:
          'Wonder Cars is truly Delhi’s most trustworthy car destination. Transparent pricing, zero hidden dealer cuts, and their 6-month assured warranty gave me complete confidence.',
        image: '/src/assets/images/car_audi_rs_etron_1794898131413.jpg',
      },
      {
        id: 'r3',
        customerName: 'Kunal Sharma',
        carPurchased: '2023 Audi RS e-tron GT',
        city: 'East Delhi',
        deliveryDate: 'November 2026',
        rating: 5,
        review:
          'Exceptional EV battery telemetry report and comprehensive 210-point audit provided upfront. If you are looking for genuine second-hand cars in top-notch condition, this is the place.',
        image: '/assets/aistudio/2023 Audi RS e-tron GT Quattro Carbon Edition/{5F6AD725-7AD9-4F6D-986E-BC7AEC2D9ED2}.png',
      },
    ],
  },

  social: {
    instagram: {
      handle: '@usedcarsnearby',
      url: 'https://www.instagram.com/usedcarsnearby?fqnt=MWdxdjZndW4zNHkwNQ%3D%3D',
      followers: 'Growing Community',
      bio: 'Daily new car inventory drops, live delivery stories, and walkaround videos.',
    },
    facebook: {
      pageName: 'Used cars nearby | Delhi',
      url: 'https://www.facebook.com/amanjain.nj784?mibextid=wwXIfr&rdid=PxDsB5WikY8FmiYB&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1AMqRrq1Si%2F%3Fmibextid%3DwwXIfr#',
      likes: 'Active Community',
      bio: 'Official Facebook page for customer updates, car listings, and special seasonal offers.',
    },
    youtube: {
      channelName: 'Used Cars Nearby',
      url: 'https://youtube.com/@usedcarsnearby?si=rLhUh-H6HIdMfBQ5',
      subscribers: 'Official Channel',
      bio: 'Watch detailed vehicle walkthroughs, exhaust sound clips, and buyer inspection guides.',
    },
  },

  showroom: {
    name: 'Wonder Cars Flagship Showroom',
    address: 'Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92.',
    landmark: 'Near Preet Vihar Metro Station',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110092',
    phone: '+91 83840 68347',
    displayPhone: '+91 83840 68347',
    whatsapp: '918384068347',
    email: 'amanjain.nj784@gmail.com',
    openingHours: 'Monday – Sunday: 10:00 AM – 8:00 PM',
    coordinates: {
      lat: 28.6396915,
      lng: 77.2936307,
    },
    googleMapsPlaceUrl:
      'https://www.google.com/maps/place/Wonder+cars/@28.6396962,77.2910558,17z/data=!3m1!4b1!4m6!3m5!1s0x390cfbb6c71185b3:0x518ca5e40932dc6d!8m2!3d28.6396915!4d77.2936307!16s%2Fg%2F11z4164dfg',
    googleMapsEmbedUrl:
      'https://maps.google.com/maps?q=loc:28.6396915,77.2936307+(Wonder+cars)&t=m&z=17&ie=UTF8&iwloc=&output=embed',
    googleMapsDirectionsUrl:
      'https://www.google.com/maps/dir//Wonder+cars/@28.6396915,77.2936307,17z/data=!4m6!3m5!1s0x390cfbb6c71185b3:0x518ca5e40932dc6d!8m2!3d28.6396915!4d77.2936307',
  },
};

