export const API = import.meta.env.VITE_API_BASE || '/api';

export const defaults = {
  locality: '',
  propertyType: 'Apartment',
  area: '',
  bedrooms: 3,
  bathrooms: 2,
  balconies: 1,
  floor: 8,
  totalFloors: 12,
  furnished: '',
  age: '',
  parking: true,
  lift: true,
  powerBackup: true,
  security: true,
  gym: false,
  swimmingPool: false
};

export const localities = [
  'Banjara Hills',
  'Jubilee Hills',
  'Gachibowli',
  'Hitech City',
  'Kondapur',
  'Madhapur',
  'Kukatpally',
  'Miyapur',
  'Manikonda',
  'Nallagandla'
];

export const types = ['Apartment', 'Villa', 'Independent House', 'Penthouse'];

export const furnished = ['Furnished', 'Semi-Furnished', 'Unfurnished'];

export const locationProfiles = {
  "Banjara Hills": { Latitude: 17.3684, Longitude: 78.4903, Distance_Metro_km: 8.1107, Distance_School_km: 4.3257, Distance_Hospital_km: 5.4197 },
  "Gachibowli": { Latitude: 17.3765, Longitude: 78.4905, Distance_Metro_km: 6.4175, Distance_School_km: 3.9407, Distance_Hospital_km: 5.7621 },
  "Hitech City": { Latitude: 17.3996, Longitude: 78.4825, Distance_Metro_km: 6.5811, Distance_School_km: 4.4059, Distance_Hospital_km: 5.4496 },
  "Jubilee Hills": { Latitude: 17.3776, Longitude: 78.4961, Distance_Metro_km: 6.8247, Distance_School_km: 4.3321, Distance_Hospital_km: 5.2647 },
  "Kondapur": { Latitude: 17.3816, Longitude: 78.4935, Distance_Metro_km: 7.5034, Distance_School_km: 3.8244, Distance_Hospital_km: 5.5081 },
  "Madhapur": { Latitude: 17.3927, Longitude: 78.4841, Distance_Metro_km: 9.0104, Distance_School_km: 4.1946, Distance_Hospital_km: 5.0821 },
  "Manikonda": { Latitude: 17.3758, Longitude: 78.4712, Distance_Metro_km: 7.9045, Distance_School_km: 4.4142, Distance_Hospital_km: 5.7582 },
  "Miyapur": { Latitude: 17.3817, Longitude: 78.49, Distance_Metro_km: 7.6346, Distance_School_km: 4.4023, Distance_Hospital_km: 4.8843 },
  "Nallagandla": { Latitude: 17.3782, Longitude: 78.4939, Distance_Metro_km: 7.359, Distance_School_km: 3.8493, Distance_Hospital_km: 5.8966 },
  "Kukatpally": { Latitude: 17.4875, Longitude: 78.3958, Distance_Metro_km: 1.5, Distance_School_km: 1.0, Distance_Hospital_km: 1.2 }
};
