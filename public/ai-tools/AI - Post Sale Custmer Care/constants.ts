import { Sale, VehicleType } from './types';

export const MOCK_SALES: Sale[] = [
  {
    id: 's1',
    customer: {
      id: 'c1',
      firstName: 'James',
      lastName: 'Miller',
      email: 'james.miller@example.com',
      phone: '555-0101',
      birthDate: '1985-05-20'
    },
    vehicle: {
      make: 'Ford',
      model: 'F-150 Lariat',
      year: 2023,
      type: VehicleType.TRUCK,
      price: 65000,
      vin: '1FTEW1E50PF001'
    },
    saleDate: '2023-10-15',
    profit: 4500,
    daysOnLot: 12,
    notes: 'Traded in a 2018 Silverado. Loves towing capability.'
  },
  {
    id: 's2',
    customer: {
      id: 'c2',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah.c@example.com',
      phone: '555-0202',
      birthDate: '1990-11-12'
    },
    vehicle: {
      make: 'Toyota',
      model: 'RAV4 Hybrid',
      year: 2024,
      type: VehicleType.SUV,
      price: 38000,
      vin: 'JTMEB3FV4ND002'
    },
    saleDate: '2024-01-10',
    profit: 2100,
    daysOnLot: 4,
    notes: 'First time buyer. Focused on fuel economy.'
  },
  {
    id: 's3',
    customer: {
      id: 'c3',
      firstName: 'Michael',
      lastName: 'Chang',
      email: 'm.chang@example.com',
      phone: '555-0303',
      birthDate: '1978-03-05'
    },
    vehicle: {
      make: 'Tesla',
      model: 'Model 3 Performance',
      year: 2024,
      type: VehicleType.EV,
      price: 54000,
      vin: '5YJ3E1EB0LF003'
    },
    saleDate: '2024-02-20',
    profit: 3200,
    daysOnLot: 25,
    notes: 'Tech enthusiast. Wanted the latest autopilot features.'
  },
  {
    id: 's4',
    customer: {
      id: 'c4',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.d@example.com',
      phone: '555-0404',
      birthDate: '1995-07-22'
    },
    vehicle: {
      make: 'Honda',
      model: 'Civic Touring',
      year: 2024,
      type: VehicleType.SEDAN,
      price: 29000,
      vin: '1HGFC1F50PH004'
    },
    saleDate: '2024-03-01',
    profit: 1500,
    daysOnLot: 8,
    notes: 'Commuter car for new job.'
  },
  {
    id: 's5',
    customer: {
      id: 'c5',
      firstName: 'Robert',
      lastName: 'Wilson',
      email: 'rwilson@example.com',
      phone: '555-0505',
      birthDate: '1965-09-14'
    },
    vehicle: {
      make: 'Chevrolet',
      model: 'Tahoe Z71',
      year: 2023,
      type: VehicleType.SUV,
      price: 72000,
      vin: '1GNSK2KD0PR005'
    },
    saleDate: '2023-12-05',
    profit: 5200,
    daysOnLot: 45,
    notes: 'Family hauler. Needs space for grandkids.'
  },
  {
    id: 's6',
    customer: {
      id: 'c6',
      firstName: 'Linda',
      lastName: 'Garcia',
      email: 'lgarcia@example.com',
      phone: '555-0606',
      birthDate: '1982-01-30'
    },
    vehicle: {
      make: 'Porsche',
      model: '911 Carrera',
      year: 2022,
      type: VehicleType.SPORTS,
      price: 115000,
      vin: 'WP0AA2A90NS006'
    },
    saleDate: '2023-08-15',
    profit: 8500,
    daysOnLot: 90,
    notes: 'Dream car purchase. Anniversary gift.'
  }
];