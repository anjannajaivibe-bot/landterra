import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
const collectionName = process.env.MONGODB_PROPERTY_COLLECTION || 'properties';

if (!uri || !/^mongodb(\+srv)?:\/\//i.test(uri)) {
  console.error('MONGODB_URI is missing or invalid.');
  process.exit(1);
}

const legacyStatuses = ['PAYMENT_PENDING', 'EXPIRING_SOON', 'EXPIRED'];

async function main() {
  await mongoose.connect(uri, {
    maxPoolSize: 3,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    family: 4,
  });

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection established without a database handle.');
  }

  const properties = db.collection(collectionName);

  const [
    totalProperties,
    statusBreakdown,
    legacyStatusCount,
    paymentStatusCount,
    subscriptionStartedCount,
    subscriptionExpiresCount,
    publishingFeePresentCount,
    publishingFeeNonZeroCount,
    monthlyListingFeePresentCount,
    monthlyListingFeeNonZeroCount,
  ] = await Promise.all([
    properties.countDocuments({}),
    properties.aggregate([
      { $group: { _id: '$listingStatus', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]).toArray(),
    properties.countDocuments({ listingStatus: { $in: legacyStatuses } }),
    properties.countDocuments({ paymentStatus: { $exists: true } }),
    properties.countDocuments({ subscriptionStartedAt: { $exists: true } }),
    properties.countDocuments({ subscriptionExpiresAt: { $exists: true } }),
    properties.countDocuments({ publishingFee: { $exists: true } }),
    properties.countDocuments({ publishingFee: { $exists: true, $ne: 0 } }),
    properties.countDocuments({ monthlyListingFee: { $exists: true } }),
    properties.countDocuments({ monthlyListingFee: { $exists: true, $ne: 0 } }),
  ]);

  let legacyIndexes = [];
  try {
    const indexes = await properties.listIndexes().toArray();
    legacyIndexes = indexes
      .filter((index) => {
        const keys = Object.keys(index.key || {});
        return keys.includes('paymentStatus') || keys.includes('subscriptionExpiresAt');
      })
      .map((index) => ({ name: index.name, key: index.key }));
  } catch (error) {
    legacyIndexes = [{ warning: 'Index inspection unavailable for this database user.' }];
  }

  const report = {
    mode: 'READ_ONLY',
    collection: collectionName,
    totalProperties,
    listingStatusBreakdown: statusBreakdown.map((row) => ({
      status: row._id ?? '(missing)',
      count: row.count,
    })),
    legacyLifecycle: {
      statuses: legacyStatuses,
      recordsUsingLegacyStatus: legacyStatusCount,
    },
    legacyFields: {
      paymentStatusPresent: paymentStatusCount,
      subscriptionStartedAtPresent: subscriptionStartedCount,
      subscriptionExpiresAtPresent: subscriptionExpiresCount,
      publishingFeePresent: publishingFeePresentCount,
      publishingFeeNonZero: publishingFeeNonZeroCount,
      monthlyListingFeePresent: monthlyListingFeePresentCount,
      monthlyListingFeeNonZero: monthlyListingFeeNonZeroCount,
    },
    legacyIndexes,
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error('Legacy listing audit failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
