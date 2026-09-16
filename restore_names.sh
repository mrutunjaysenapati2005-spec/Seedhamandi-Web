#!/bin/bash
sed -i "s/name: 'Onion'/name: 'Fresh Nashik Red Onions (Direct Farm Lot)'/g" server/db.ts
sed -i "s/cropName: 'Onion'/cropName: 'Nashik Red Onions'/g" server/db.ts
sed -i "s/for Onion (10 kg)/for Nashik Red Onions (10 kg)/g" server/db.ts

sed -i "s/name: 'Mango'/name: 'Devgad Alphonso Mangoes (GI Tagged)'/g" server/db.ts
sed -i "s/name: 'Wheat'/name: 'Sharbati Wheat (Sehore Golden Grain)'/g" server/db.ts
sed -i "s/name: 'Tomato'/name: 'Organic Vine Ripe Tomatoes (Polyhouse)'/g" server/db.ts
sed -i "s/name: 'Strawberry'/name: 'Mahabaleshwar Winter Strawberries (Farm Picked)'/g" server/db.ts
sed -i "s/name: 'Cardamom'/name: 'Wayanad Green Cardamom (8mm Bold)'/g" server/db.ts
sed -i "s/name: 'Gram'/name: 'Desi Chana \\/ Bengal Gram (Unpolished)'/g" server/db.ts
sed -i "s/name: 'Apple'/name: 'Himachal Royal Delicious Apples'/g" server/db.ts

sed -i 's/\*\*Onion\*\*: In high demand/\*\*Nashik Red Onions\*\*: In high demand/g' server/ai.ts
sed -i 's/\*\*Onion\*\*: APMC Mandi/\*\*Red Onions\*\*: APMC Mandi/g' server/ai.ts
sed -i "s/produce: 'Onion'/produce: 'Nashik Red Onions'/g" server/ai.ts

sed -i "s/crop: 'Onion'/crop: 'Nashik Red Onions'/g" server.ts

sed -i "s/name: 'Fresh Onion (Direct Farm Lot)'/name: 'Fresh Nashik Red Onions (Direct Farm Lot)'/g" src/pages/FarmerDashboard.tsx
sed -i "s/name: 'Onion (Grade A Export Quality)'/name: 'Nashik Red Onions (Grade A Export Quality)'/g" src/pages/FarmerDashboard.tsx
sed -i 's/placeholder="e.g. Onion"/placeholder="e.g. Red Nashik Onions"/g' src/pages/FarmerDashboard.tsx

sed -i "s/produceName: 'Onion & Gram (Bulk Lot)'/produceName: 'Nashik Red Onions \\& Desi Chana (Bulk Lot)'/g" src/pages/LogisticsDashboard.tsx
sed -i "s/produce: 'Onion (25 kg) + Wheat (30 kg)'/produce: 'Nashik Red Onions (25 kg) + Sharbati Gehu (30 kg)'/g" src/pages/LogisticsDashboard.tsx
sed -i "s/produce: 'Organic Tomatoes (10 kg) + Gram (40 kg)'/produce: 'Organic Tomatoes (10 kg) + Desi Chana (40 kg)'/g" src/pages/LogisticsDashboard.tsx
sed -i "s/produce: 'Onion (450 kg Bulk Lot)'/produce: 'Export Quality Onions (450 kg Bulk Lot)'/g" src/pages/LogisticsDashboard.tsx

sed -i "s/useState('Onion')/useState('Nashik Red Onions')/g" src/pages/MarketplacePage.tsx
sed -i 's/placeholder="e.g. Onion"/placeholder="e.g. Nashik Red Onions"/g' src/pages/MarketplacePage.tsx

sed -i "s/useState('Onion')/useState('Nashik Red Onions')/g" src/pages/DemandIntelligencePage.tsx
sed -i "s/produce: 'Onion'/produce: 'Nashik Red Onions'/g" src/pages/DemandIntelligencePage.tsx
sed -i 's/"Onion">Onion/"Nashik Red Onions">Nashik Red Onions/g' src/pages/DemandIntelligencePage.tsx

sed -i "s/cropName: 'Onion'/cropName: 'Nashik Red Onions'/g" src/components/FarmerDemandInventoryD3Chart.tsx
