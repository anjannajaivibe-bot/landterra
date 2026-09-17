import mongoose from 'mongoose';
import { getProperties } from '../services/property.service.js';

import fs from 'fs';
import path from 'path';

let envUri = process.env.MONGODB_URI;
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/MONGODB_URI\s*=\s*([^\r\n]+)/);
    if (match) envUri = match[1].trim().replace(/^["']|["']$/g, '');
  }
} catch (e) {}

const MONGODB_URI = envUri || 'mongodb://localhost:27017/landterra';

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE FILTER TESTS ---');
  await mongoose.connect(MONGODB_URI!, { bufferCommands: false });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: City = "Beyond Thane"
  console.log('\n[Test 1] City = "Beyond Thane"');
  const resBeyondThane = await getProperties({ city: 'Beyond Thane' });
  assert(resBeyondThane.data.length > 0, `Found ${resBeyondThane.data.length} properties for Beyond Thane`);
  assert(
    resBeyondThane.data.every((p) => (p.location?.city === 'Beyond Thane' || p.location?.address?.includes('Beyond Thane'))),
    'ALL returned properties strictly belong to Beyond Thane'
  );
  assert(
    resBeyondThane.data.every((p) => p.location?.city !== 'Hyderabad'),
    'NO Hyderabad properties leaked into Beyond Thane results'
  );

  // TEST 2: City = "Hyderabad"
  console.log('\n[Test 2] City = "Hyderabad"');
  const resHyd = await getProperties({ city: 'Hyderabad' });
  assert(resHyd.data.length > 0, `Found ${resHyd.data.length} properties for Hyderabad`);
  assert(
    resHyd.data.every((p) => p.location?.city === 'Hyderabad'),
    'ALL returned properties strictly belong to Hyderabad'
  );
  assert(
    resHyd.data.every((p) => p.location?.city !== 'Beyond Thane' && p.location?.city !== 'Mumbai'),
    'NO Mumbai or Beyond Thane properties in Hyderabad results'
  );

  // TEST 3: City = "Mumbai"
  console.log('\n[Test 3] City = "Mumbai"');
  const resMumbai = await getProperties({ city: 'Mumbai' });
  assert(resMumbai.data.length === 1, `Found ${resMumbai.data.length} property for Mumbai`);
  assert(resMumbai.data[0]?.location?.city === 'Mumbai', 'Property is in Mumbai');

  // TEST 4: Non-existent City = "Jaipur"
  console.log('\n[Test 4] City = "Jaipur" (Zero matches expected)');
  const resJaipur = await getProperties({ city: 'Jaipur' });
  assert(resJaipur.data.length === 0, `Returned 0 properties as expected (got ${resJaipur.data.length})`);

  // TEST 5: State = "Maharashtra"
  console.log('\n[Test 5] State = "Maharashtra"');
  const resMH = await getProperties({ state: 'Maharashtra' });
  assert(resMH.data.length >= 2, `Found ${resMH.data.length} properties in Maharashtra`);
  assert(
    resMH.data.every((p) => p.location?.state === 'Maharashtra'),
    'ALL returned properties strictly belong to Maharashtra'
  );

  // TEST 6: State = "Telangana"
  console.log('\n[Test 6] State = "Telangana"');
  const resTG = await getProperties({ state: 'Telangana' });
  assert(
    resTG.data.every((p) => p.location?.state === 'Telangana'),
    'ALL returned properties strictly belong to Telangana'
  );

  // TEST 7: Property Type = "FLAT"
  console.log('\n[Test 7] Land/Property Type = "FLAT"');
  const resFlat = await getProperties({ landType: 'FLAT' as any });
  assert(resFlat.data.length > 0, `Found ${resFlat.data.length} flat(s)`);
  assert(
    resFlat.data.every((p) => p.landType === 'FLAT' || p.propertyType === 'FLAT'),
    'ALL returned properties are flats'
  );

  // TEST 8: Property Type = "RESIDENTIAL_PLOT"
  console.log('\n[Test 8] Land/Property Type = "RESIDENTIAL_PLOT"');
  const resPlot = await getProperties({ landType: 'RESIDENTIAL_PLOT' as any });
  assert(
    resPlot.data.every((p) => p.landType === 'RESIDENTIAL_PLOT'),
    'ALL returned properties are residential plots'
  );

  // TEST 9: Price filter <= ₹50 Lakhs (maxPrice = 5,000,000)
  console.log('\n[Test 9] Price <= ₹50 Lakhs');
  const resPrice50L = await getProperties({ maxPrice: 5000000 });
  assert(resPrice50L.data.length > 0, `Found ${resPrice50L.data.length} properties under ₹50L`);
  assert(
    resPrice50L.data.every((p) => p.totalPrice <= 5000000),
    'ALL returned properties have totalPrice <= 5,000,000'
  );

  // TEST 10: Area filter >= 1,000 sq.yards (minArea = 1000)
  console.log('\n[Test 10] Area >= 1,000 sq.yards');
  const resArea1000 = await getProperties({ minArea: 1000 });
  assert(resArea1000.data.length > 0, `Found ${resArea1000.data.length} large properties`);
  assert(
    resArea1000.data.every((p) => p.landAreaYards >= 1000),
    'ALL returned properties have landAreaYards >= 1000'
  );

  // TEST 11: Compound filter: State = "Maharashtra" AND landType = "FLAT"
  console.log('\n[Test 11] Compound: State="Maharashtra" AND landType="FLAT"');
  const resMHFlat = await getProperties({ state: 'Maharashtra', landType: 'FLAT' as any });
  assert(resMHFlat.data.length === 1, `Found exactly 1 flat in Maharashtra`);
  assert(resMHFlat.data[0]?.location?.city === 'Mumbai', 'Flat is in Bandra, Mumbai');

  // TEST 12: Compound filter: City = "Beyond Thane" AND landType = "FLAT" (Should be 0)
  console.log('\n[Test 12] Compound: City="Beyond Thane" AND landType="FLAT" (0 expected)');
  const resBeyondThaneFlat = await getProperties({ city: 'Beyond Thane', landType: 'FLAT' as any });
  assert(resBeyondThaneFlat.data.length === 0, `Returned 0 properties (got ${resBeyondThaneFlat.data.length})`);

  // TEST 13: Compound filter: City = "Beyond Thane" AND landType = "RESIDENTIAL_PLOT"
  console.log('\n[Test 13] Compound: City="Beyond Thane" AND landType="RESIDENTIAL_PLOT"');
  const resBeyondThanePlot = await getProperties({ city: 'Beyond Thane', landType: 'RESIDENTIAL_PLOT' as any });
  assert(resBeyondThanePlot.data.length === 1, `Found 1 residential plot in Beyond Thane`);
  assert(resBeyondThanePlot.data[0]?.location?.city === 'Beyond Thane', 'Property is in Beyond Thane');

  // TEST 14: Text search query = "Farmhouse"
  console.log('\n[Test 14] Query = "Farmhouse"');
  const resQueryFarm = await getProperties({ query: 'Farmhouse' });
  assert(resQueryFarm.data.length > 0, `Found ${resQueryFarm.data.length} matching "Farmhouse"`);
  assert(
    resQueryFarm.data.every((p) => p.title.toLowerCase().includes('farm') || p.landType.includes('FARM')),
    'ALL results match Farmhouse keyword'
  );

  // TEST 15: Text search query = "Maharashtra" (Typing state in search bar)
  console.log('\n[Test 15] Query = "Maharashtra" (Typing state name in search input)');
  const resQueryMaha = await getProperties({ query: 'Maharashtra' });
  assert(resQueryMaha.data.length === 2, `Found exactly 2 properties typing "Maharashtra" (got ${resQueryMaha.data.length})`);
  assert(
    resQueryMaha.data.every((p) => p.location.state === 'Maharashtra'),
    'ALL results belong to Maharashtra state'
  );

  // TEST 16: City/Location = "Maharashtra" AND State = "Maharashtra" (Compound state match)
  console.log('\n[Test 16] City = "Maharashtra" (Passed as location)');
  const resCityMaha = await getProperties({ city: 'Maharashtra' });
  assert(resCityMaha.data.length === 2, `Found 2 properties for city="Maharashtra" (got ${resCityMaha.data.length})`);


  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`========================================`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
