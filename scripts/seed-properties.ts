import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const SAMPLE_PROPERTIES = [
  {
    sellerId: 'demo_seller_001',
    sellerName: 'Srikanth Reddy',
    sellerPhone: '+91 98490 12345',
    sellerEmail: 'srikanth.reddy@example.com',
    sellerType: 'INDIVIDUAL',
    title: 'HMDA Approved Luxury Villa Plot in Kokapet',
    description:
      'Clear title 350 sq.yd east-facing residential plot in prestigious gated layout. 100% Vastu compliant, ready for immediate villa construction with 40ft blacktop road, water & underground power.',
    landAreaYards: 350,
    pricePerYard: 48000,
    totalPrice: 16800000,
    priceNegotiable: true,
    publishingFee: 10,
    monthlyListingFee: 10,
    landType: 'RESIDENTIAL_PLOT',
    roadAccess: '40 Feet BT Road',
    nearbyLandmarks: ['Near Neopolis Kokapet', 'Outer Ring Road Exit 1', 'Financial District'],
    location: {
      address: 'Plot 42, Golden Meadows, Kokapet',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500075',
      district: 'Ranga Reddy',
    },
    latitude: 17.397,
    longitude: 78.334,
    locationCoordinates: {
      type: 'Point',
      coordinates: [78.334, 17.397],
    },
    verificationStatus: 'VERIFIED',
    paymentStatus: 'PAID',
    listingStatus: 'PUBLISHED',
    publishedAt: new Date(),
    subscriptionStartedAt: new Date(),
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    images: [
      {
        objectKey: 'seed_img_1',
        secureUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
        fileName: 'kokapet-plot.jpg',
        mimeType: 'image/jpeg',
        size: 245000,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
  },
  {
    sellerId: 'demo_seller_002',
    sellerName: 'Venkata Rao',
    sellerPhone: '+91 94401 67890',
    sellerEmail: 'venkat.rao@example.com',
    sellerType: 'INDIVIDUAL',
    title: 'Fertile Organic Farmland with Drip Irrigation in Moinabad',
    description:
      '2,420 sq.yd (0.5 Acre) fertile red soil agricultural land with 2 sweet water borewells, drip irrigation system, fenced perimeter, and road frontage. Perfect for farmhouse or weekend retreat, only 35 mins from Gachibowli.',
    landAreaYards: 2420,
    pricePerYard: 3500,
    totalPrice: 8470000,
    priceNegotiable: false,
    publishingFee: 10,
    monthlyListingFee: 10,
    landType: 'AGRICULTURAL_LAND',
    roadAccess: '30 Feet Panchayati Road',
    nearbyLandmarks: ['Chilkur Balaji Temple Road', 'Moinabad Town Center'],
    location: {
      address: 'Survey No. 114/A, Kanakamamidi, Moinabad',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '501504',
      district: 'Ranga Reddy',
    },
    latitude: 17.325,
    longitude: 78.272,
    locationCoordinates: {
      type: 'Point',
      coordinates: [78.272, 17.325],
    },
    verificationStatus: 'VERIFIED',
    paymentStatus: 'PAID',
    listingStatus: 'PUBLISHED',
    publishedAt: new Date(),
    subscriptionStartedAt: new Date(),
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    images: [
      {
        objectKey: 'seed_img_2',
        secureUrl: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?w=800&auto=format&fit=crop&q=80',
        fileName: 'moinabad-farmland.jpg',
        mimeType: 'image/jpeg',
        size: 310000,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
  },
  {
    sellerId: 'demo_seller_003',
    sellerName: 'KVR Infra Projects',
    sellerPhone: '+91 866 245 9900',
    sellerEmail: 'contact@kvrinfra.in',
    sellerType: 'COMPANY',
    title: 'Prime Commercial Corner Plot on Vijayawada Highway',
    description:
      '1,200 sq.yd high-visibility highway frontage land ideal for commercial complex, hotel, showroom, or logistics depot. 60ft wide service road access, 100% clear legal title, booming growth corridor.',
    landAreaYards: 1200,
    pricePerYard: 25000,
    totalPrice: 30000000,
    priceNegotiable: true,
    publishingFee: 10,
    monthlyListingFee: 10,
    landType: 'COMMERCIAL_LAND',
    roadAccess: '60 Feet Highway Service Road',
    nearbyLandmarks: ['Benz Circle 10 Mins', 'Gannavaram Airport Road'],
    location: {
      address: 'NH-16 Highway Frontage, Enikepadu',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      pincode: '521108',
      district: 'Krishna',
    },
    latitude: 16.518,
    longitude: 80.648,
    locationCoordinates: {
      type: 'Point',
      coordinates: [80.648, 16.518],
    },
    verificationStatus: 'VERIFIED',
    paymentStatus: 'PAID',
    listingStatus: 'PUBLISHED',
    publishedAt: new Date(),
    subscriptionStartedAt: new Date(),
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    images: [
      {
        objectKey: 'seed_img_3',
        secureUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
        fileName: 'commercial-highway-land.jpg',
        mimeType: 'image/jpeg',
        size: 290000,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
  },
  {
    sellerId: 'demo_seller_004',
    sellerName: 'Naveen Kumar',
    sellerPhone: '+91 97011 44556',
    sellerEmail: 'jairammargam02@gmail.com',
    sellerType: 'INDIVIDUAL',
    title: 'Scenic Hillview Gated Farmhouse Plot in Shankarpally',
    description:
      '600 sq.yd gated farmhouse plot with fruit-bearing mango trees, clubhouse access, underground electricity and 24/7 security. Peaceful pollution-free zone ideal for retirement home or weekend family stay.',
    landAreaYards: 600,
    pricePerYard: 9500,
    totalPrice: 5700000,
    priceNegotiable: true,
    publishingFee: 10,
    monthlyListingFee: 10,
    landType: 'FARM_HOUSE_LAND',
    roadAccess: '33 Feet Tar Road',
    nearbyLandmarks: ['Near Shankarpally Railway Station', 'Mokila Corridor'],
    location: {
      address: 'Plot 18, Prakriti County, Shankarpally',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '501203',
      district: 'Ranga Reddy',
    },
    latitude: 17.452,
    longitude: 78.132,
    locationCoordinates: {
      type: 'Point',
      coordinates: [78.132, 17.452],
    },
    verificationStatus: 'VERIFIED',
    paymentStatus: 'PAID',
    listingStatus: 'PUBLISHED',
    publishedAt: new Date(),
    subscriptionStartedAt: new Date(),
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    images: [
      {
        objectKey: 'seed_img_4',
        secureUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
        fileName: 'shankarpally-farmhouse.jpg',
        mimeType: 'image/jpeg',
        size: 325000,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
  },
  {
    sellerId: 'demo_seller_005',
    sellerName: 'Sunil Deshmukh',
    sellerPhone: '+91 98220 54321',
    sellerEmail: 'sunil.deshmukh@example.com',
    sellerType: 'INDIVIDUAL',
    title: 'Scenic Foothill Residential Plot in Beyond Thane (Badlapur)',
    description:
      'Clear title 250 sq.yd residential plot situated in a serene green valley layout in Beyond Thane, Badlapur East. Excellent connectivity to railway station and highway, with water and electricity connections in place.',
    landAreaYards: 250,
    pricePerYard: 14000,
    totalPrice: 3500000,
    priceNegotiable: true,
    publishingFee: 10,
    monthlyListingFee: 10,
    landType: 'RESIDENTIAL_PLOT',
    roadAccess: '30 Feet Concrete Road',
    nearbyLandmarks: ['Badlapur Railway Station 10 Mins', 'Barvi Dam Road'],
    location: {
      address: 'Plot 12, Green Hill Enclave, Badlapur East',
      city: 'Beyond Thane',
      state: 'Maharashtra',
      pincode: '421503',
      district: 'Thane',
    },
    latitude: 19.167,
    longitude: 73.264,
    locationCoordinates: {
      type: 'Point',
      coordinates: [73.264, 19.167],
    },
    verificationStatus: 'VERIFIED',
    paymentStatus: 'PAID',
    listingStatus: 'PUBLISHED',
    publishedAt: new Date(),
    subscriptionStartedAt: new Date(),
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    images: [
      {
        objectKey: 'seed_img_5',
        secureUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
        fileName: 'beyond-thane-plot.jpg',
        mimeType: 'image/jpeg',
        size: 280000,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
  },
  {
    sellerId: 'demo_seller_006',
    sellerName: 'Rohit Mehta',
    sellerPhone: '+91 98200 98765',
    sellerEmail: 'rohit.mehta@example.com',
    sellerType: 'INDIVIDUAL',
    title: 'Luxury 3 BHK Sea-Facing Flat in Bandra West',
    description:
      'Spacious 1,850 sq.ft (205 sq.yd) 3 BHK luxury apartment with expansive Arabian Sea views, designer interiors, 2 dedicated car parking slots, gym, and infinity pool access.',
    landAreaYards: 205,
    pricePerYard: 240000,
    totalPrice: 49200000,
    priceNegotiable: false,
    publishingFee: 10,
    monthlyListingFee: 10,
    landType: 'FLAT',
    propertyType: 'FLAT',
    bhk: '3 BHK',
    roadAccess: '60 Feet Main Road',
    nearbyLandmarks: ['Carter Road Promenade', 'Bandra-Worli Sea Link'],
    location: {
      address: 'Floor 14, Ocean Breeze Tower, Carter Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      district: 'Mumbai Suburban',
    },
    latitude: 19.062,
    longitude: 72.825,
    locationCoordinates: {
      type: 'Point',
      coordinates: [72.825, 19.062],
    },
    verificationStatus: 'VERIFIED',
    paymentStatus: 'PAID',
    listingStatus: 'PUBLISHED',
    publishedAt: new Date(),
    subscriptionStartedAt: new Date(),
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    images: [
      {
        objectKey: 'seed_img_6',
        secureUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
        fileName: 'bandra-flat.jpg',
        mimeType: 'image/jpeg',
        size: 320000,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
  },
  {
    sellerId: 'demo_seller_007',
    sellerName: 'Praveen Gowda',
    sellerPhone: '+91 98450 11223',
    sellerEmail: 'praveen.gowda@example.com',
    sellerType: 'INDIVIDUAL',
    title: 'Gated 4 BHK Contemporary Villa in Whitefield',
    description:
      'Lavish 4 BHK independent triplex villa on 300 sq.yd plot in prime Whitefield IT corridor. Private landscaped garden, home theatre room, solar power backup, and round-the-clock security.',
    landAreaYards: 300,
    pricePerYard: 95000,
    totalPrice: 28500000,
    priceNegotiable: true,
    publishingFee: 10,
    monthlyListingFee: 10,
    landType: 'HOUSE_VILLA',
    propertyType: 'HOUSE_VILLA',
    bhk: '4 BHK',
    roadAccess: '40 Feet Internal Paved Road',
    nearbyLandmarks: ['ITPL Main Gate', 'Hope Farm Junction'],
    location: {
      address: 'Villa 28, Palm Meadows Extension, Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560066',
      district: 'Bengaluru Urban',
    },
    latitude: 12.971,
    longitude: 77.75,
    locationCoordinates: {
      type: 'Point',
      coordinates: [77.75, 12.971],
    },
    verificationStatus: 'VERIFIED',
    paymentStatus: 'PAID',
    listingStatus: 'PUBLISHED',
    publishedAt: new Date(),
    subscriptionStartedAt: new Date(),
    subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    images: [
      {
        objectKey: 'seed_img_7',
        secureUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80',
        fileName: 'whitefield-villa.jpg',
        mimeType: 'image/jpeg',
        size: 340000,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!, {
      bufferCommands: false,
    });
    console.log('Connected successfully.');

    const { PropertyModel } = await import('../models/Property.js');

    // Remove any previous seed records
    await PropertyModel.deleteMany({
      sellerId: {
        $in: [
          'demo_seller_001',
          'demo_seller_002',
          'demo_seller_003',
          'demo_seller_004',
          'demo_seller_005',
          'demo_seller_006',
          'demo_seller_007',
        ],
      },
    });

    console.log(`Inserting ${SAMPLE_PROPERTIES.length} realistic sample properties across India...`);
    const created = await PropertyModel.insertMany(SAMPLE_PROPERTIES);
    console.log(`Successfully created ${created.length} properties:`);
    created.forEach((p) =>
      console.log(`- [${p.location?.city}, ${p.location?.state}] [${p.landType}] ${p.title} (₹${p.totalPrice.toLocaleString('en-IN')})`)
    );

    await mongoose.disconnect();
    console.log('Finished.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
