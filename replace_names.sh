#!/bin/bash
sed -i 's/Fresh Nashik Red Onions (Direct Farm Lot)/Onion/g' server/db.ts
sed -i 's/Nashik Red Onions/Onion/g' server/db.ts server/ai.ts server.ts src/pages/FarmerDashboard.tsx src/pages/LogisticsDashboard.tsx src/pages/MarketplacePage.tsx src/pages/DemandIntelligencePage.tsx src/components/FarmerDemandInventoryD3Chart.tsx
sed -i 's/Red Nashik Onions/Onion/g' src/pages/FarmerDashboard.tsx
sed -i 's/Red Onions/Onion/g' server/ai.ts
sed -i 's/Export Quality Onions/Onion/g' src/pages/LogisticsDashboard.tsx
sed -i 's/Devgad Alphonso Mangoes (GI Tagged)/Mango/g' server/db.ts
sed -i 's/Sharbati Wheat (Sehore Golden Grain)/Wheat/g' server/db.ts
sed -i 's/Sharbati Gehu/Wheat/g' src/pages/LogisticsDashboard.tsx
sed -i 's/Organic Vine Ripe Tomatoes (Polyhouse)/Tomato/g' server/db.ts
sed -i 's/Mahabaleshwar Winter Strawberries (Farm Picked)/Strawberry/g' server/db.ts
sed -i 's/Wayanad Green Cardamom (8mm Bold)/Cardamom/g' server/db.ts
sed -i 's/Desi Chana \/ Bengal Gram (Unpolished)/Gram/g' server/db.ts
sed -i 's/Desi Chana/Gram/g' src/pages/LogisticsDashboard.tsx
sed -i 's/Himachal Royal Delicious Apples/Apple/g' server/db.ts
