import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

// Load .env.local manually to ensure MONGODB_URI is available
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalsIdx = trimmed.indexOf('=');
      if (equalsIdx > 0) {
        const key = trimmed.slice(0, equalsIdx).trim();
        let value = trimmed.slice(equalsIdx + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
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
      pincode: '520001',
      district: 'Krishna',
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
    await PropertyModel.deleteMany({ sellerId: { $in: ['demo_seller_001', 'demo_seller_002', 'demo_seller_003', 'demo_seller_004'] } });

    console.log('Inserting 4 realistic sample properties...');
    const created = await PropertyModel.insertMany(SAMPLE_PROPERTIES);
    console.log(`Successfully created ${created.length} properties:`);
    created.forEach((p) => console.log(`- [${p.landType}] ${p.title} (₹${p.totalPrice.toLocaleString('en-IN')})`));

    await mongoose.disconnect();
    console.log('Finished.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
