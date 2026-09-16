const fs = require('fs');

const dbContent = fs.readFileSync('server/db.ts', 'utf-8');

const newProducts = `
  {
    id: 'prod_9', name: 'Brinjal', category: 'Vegetables', quantity: 500, unit: 'kg',
    price: 35, mandiBenchmarkPrice: 28, minOrderQty: 10, location: 'Pune', state: 'Maharashtra',
    harvestDate: 'Fresh', qualityGrade: 'Standard', image: 'https://images.unsplash.com/photo-1596756858487-73d6ebefdce0?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh purple brinjal', availability: true, farmerId: 'usr_farmer_1', farmerName: 'Ramesh Patel', farmerPhone: '+91 98234 11201', organicCertified: false, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_10', name: 'Spinach', category: 'Vegetables', quantity: 200, unit: 'kg',
    price: 20, mandiBenchmarkPrice: 15, minOrderQty: 5, location: 'Nashik', state: 'Maharashtra',
    harvestDate: 'Fresh', qualityGrade: 'Standard', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    description: 'Green leafy spinach', availability: true, farmerId: 'usr_farmer_1', farmerName: 'Ramesh Patel', farmerPhone: '+91 98234 11201', organicCertified: true, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_11', name: 'Carrot', category: 'Vegetables', quantity: 800, unit: 'kg',
    price: 40, mandiBenchmarkPrice: 32, minOrderQty: 15, location: 'Ooty', state: 'Tamil Nadu',
    harvestDate: 'Fresh', qualityGrade: 'Premium', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
    description: 'Orange fresh carrots', availability: true, farmerId: 'usr_farmer_1', farmerName: 'Ramesh Patel', farmerPhone: '+91 98234 11201', organicCertified: false, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_12', name: 'Capsicum', category: 'Vegetables', quantity: 400, unit: 'kg',
    price: 60, mandiBenchmarkPrice: 50, minOrderQty: 10, location: 'Baramati', state: 'Maharashtra',
    harvestDate: 'Fresh', qualityGrade: 'Premium', image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=600&q=80',
    description: 'Green Capsicum', availability: true, farmerId: 'usr_fpo_1', farmerName: 'Sahyadri Kisan Samriddhi FPO', farmerPhone: '+91 98765 43210', organicCertified: false, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_13', name: 'Beetroot', category: 'Vegetables', quantity: 600, unit: 'kg',
    price: 45, mandiBenchmarkPrice: 35, minOrderQty: 10, location: 'Nashik', state: 'Maharashtra',
    harvestDate: 'Fresh', qualityGrade: 'Standard', image: 'https://images.unsplash.com/photo-1582281295982-f25fba0b213c?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh Beetroot', availability: true, farmerId: 'usr_farmer_1', farmerName: 'Ramesh Patel', farmerPhone: '+91 98234 11201', organicCertified: false, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_14', name: 'Oranges', category: 'Fruits', quantity: 1200, unit: 'crates',
    price: 800, mandiBenchmarkPrice: 650, minOrderQty: 5, location: 'Nagpur', state: 'Maharashtra',
    harvestDate: 'Fresh', qualityGrade: 'Premium', image: 'https://images.unsplash.com/photo-1547514701-42722101795e?auto=format&fit=crop&w=600&q=80',
    description: 'Nagpur Oranges', availability: true, farmerId: 'usr_fpo_1', farmerName: 'Sahyadri Kisan Samriddhi FPO', farmerPhone: '+91 98765 43210', organicCertified: false, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_15', name: 'Pineapple', category: 'Fruits', quantity: 300, unit: 'crates',
    price: 400, mandiBenchmarkPrice: 350, minOrderQty: 2, location: 'Kochi', state: 'Kerala',
    harvestDate: 'Fresh', qualityGrade: 'Premium', image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh Pineapple', availability: true, farmerId: 'usr_fpo_1', farmerName: 'Sahyadri Kisan Samriddhi FPO', farmerPhone: '+91 98765 43210', organicCertified: false, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_16', name: 'Rice', category: 'Grains', quantity: 5000, unit: 'kg',
    price: 65, mandiBenchmarkPrice: 55, minOrderQty: 50, location: 'Burdwan', state: 'West Bengal',
    harvestDate: 'Fresh', qualityGrade: 'Premium', image: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=600&q=80',
    description: 'Basmati Rice', availability: true, farmerId: 'usr_farmer_1', farmerName: 'Ramesh Patel', farmerPhone: '+91 98234 11201', organicCertified: false, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_17', name: 'Potato', category: 'Vegetables', quantity: 2000, unit: 'kg',
    price: 25, mandiBenchmarkPrice: 18, minOrderQty: 20, location: 'Agra', state: 'Uttar Pradesh',
    harvestDate: 'Fresh', qualityGrade: 'Standard', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh Potato', availability: true, farmerId: 'usr_farmer_1', farmerName: 'Ramesh Patel', farmerPhone: '+91 98234 11201', organicCertified: false, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_18', name: 'Cabbage', category: 'Vegetables', quantity: 700, unit: 'kg',
    price: 15, mandiBenchmarkPrice: 10, minOrderQty: 10, location: 'Nashik', state: 'Maharashtra',
    harvestDate: 'Fresh', qualityGrade: 'Standard', image: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=600&q=80',
    description: 'Green Cabbage', availability: true, farmerId: 'usr_farmer_1', farmerName: 'Ramesh Patel', farmerPhone: '+91 98234 11201', organicCertified: false, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_19', name: 'Cauliflower', category: 'Vegetables', quantity: 600, unit: 'kg',
    price: 25, mandiBenchmarkPrice: 18, minOrderQty: 10, location: 'Nashik', state: 'Maharashtra',
    harvestDate: 'Fresh', qualityGrade: 'Standard', image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh Cauliflower', availability: true, farmerId: 'usr_fpo_1', farmerName: 'Sahyadri Kisan Samriddhi FPO', farmerPhone: '+91 98765 43210', organicCertified: false, createdAt: new Date().toISOString()
  },
  {
    id: 'prod_20', name: 'Pea', category: 'Vegetables', quantity: 300, unit: 'kg',
    price: 45, mandiBenchmarkPrice: 35, minOrderQty: 10, location: 'Shimla', state: 'Himachal Pradesh',
    harvestDate: 'Fresh', qualityGrade: 'Standard', image: 'https://images.unsplash.com/photo-1599818815152-da7361bf150e?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh Green Peas', availability: true, farmerId: 'usr_farmer_1', farmerName: 'Ramesh Patel', farmerPhone: '+91 98234 11201', organicCertified: false, createdAt: new Date().toISOString()
  },
];
`;

const updatedContent = dbContent.replace(
  /];\s*const initialOrders:/,
  newProducts.slice(0, -3) + "\n];\n\nconst initialOrders:"
);

fs.writeFileSync('server/db.ts', updatedContent);
