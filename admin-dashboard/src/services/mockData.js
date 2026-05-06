export const users = [
  { id: 1, name: 'Sadini Perera', email: 'sadini@florana.lk', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Amal Fernando', email: 'amal@example.com', role: 'Customer', status: 'Active' },
  { id: 3, name: 'Nimali Silva', email: 'nimali@example.com', role: 'Seller', status: 'Blocked' },
  { id: 4, name: 'Kavindu Jay', email: 'kavindu@example.com', role: 'Customer', status: 'Active' },
];

export const plants = [
  { id: 1, name: 'Monstera Deliciosa', user: 'Amal Fernando', location: 'Colombo', status: 'Healthy', image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=300&q=80' },
  { id: 2, name: 'Peace Lily', user: 'Nimali Silva', location: 'Kandy', status: 'Needs Care', image: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?auto=format&fit=crop&w=300&q=80' },
  { id: 3, name: 'Snake Plant', user: 'Kavindu Jay', location: 'Galle', status: 'Healthy', image: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?auto=format&fit=crop&w=300&q=80' },
];

export const products = [
  { id: 1, name: 'Organic Potting Mix', price: 950, season: 'All Season', status: 'Approved', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=300&q=80' },
  { id: 2, name: 'Neem Oil Spray', price: 1250, season: 'Wet Season', status: 'Pending', image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=300&q=80' },
  { id: 3, name: 'Ceramic Herb Pot', price: 1800, season: 'Dry Season', status: 'Rejected', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=300&q=80' },
];

export const predictions = [
  { id: 1, result: 'Leaf Spot', risk: 'High', timestamp: '2026-05-01 09:20', image: 'https://images.unsplash.com/photo-1598512752271-33f913a5af13?auto=format&fit=crop&w=300&q=80' },
  { id: 2, result: 'Powdery Mildew', risk: 'Medium', timestamp: '2026-05-01 11:12', image: 'https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?auto=format&fit=crop&w=300&q=80' },
  { id: 3, result: 'Healthy', risk: 'Low', timestamp: '2026-05-02 08:45', image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=300&q=80' },
];

export const orders = [
  { id: 'ORD-1021', user: 'Amal Fernando', amount: 3450, status: 'Paid' },
  { id: 'ORD-1022', user: 'Nimali Silva', amount: 1250, status: 'Pending' },
  { id: 'ORD-1023', user: 'Kavindu Jay', amount: 5400, status: 'Refunded' },
];

export const feedback = [
  { id: 1, user: 'Amal Fernando', message: 'The disease scanner helped me treat my Monstera quickly.', sentiment: 'Positive' },
  { id: 2, user: 'Nimali Silva', message: 'Please add more fertilizer products for indoor plants.', sentiment: 'Neutral' },
  { id: 3, user: 'Kavindu Jay', message: 'Order tracking was delayed for my last purchase.', sentiment: 'Negative' },
];

export const weeklyActivity = [
  { day: 'Mon', users: 22, plants: 14, predictions: 31, products: 8 },
  { day: 'Tue', users: 31, plants: 19, predictions: 44, products: 10 },
  { day: 'Wed', users: 28, plants: 24, predictions: 38, products: 13 },
  { day: 'Thu', users: 42, plants: 30, predictions: 59, products: 17 },
  { day: 'Fri', users: 39, plants: 28, predictions: 52, products: 12 },
  { day: 'Sat', users: 51, plants: 37, predictions: 68, products: 20 },
  { day: 'Sun', users: 45, plants: 33, predictions: 61, products: 18 },
];

export const usageHistory = [
  { day: 'Mon', logins: 86, scans: 31, carePlans: 18 },
  { day: 'Tue', logins: 104, scans: 44, carePlans: 22 },
  { day: 'Wed', logins: 98, scans: 38, carePlans: 26 },
  { day: 'Thu', logins: 128, scans: 59, carePlans: 33 },
  { day: 'Fri', logins: 121, scans: 52, carePlans: 29 },
  { day: 'Sat', logins: 146, scans: 68, carePlans: 41 },
  { day: 'Sun', logins: 132, scans: 61, carePlans: 36 },
];

export const diseaseBreakdown = [
  { name: 'Leaf Spot', value: 38 },
  { name: 'Powdery Mildew', value: 27 },
  { name: 'Root Rot', value: 18 },
  { name: 'Blight', value: 17 },
];

export const diseaseDetectedUsage = [
  { disease: 'Leaf Spot', detected: 38 },
  { disease: 'Mildew', detected: 27 },
  { disease: 'Root Rot', detected: 18 },
  { disease: 'Blight', detected: 17 },
  { disease: 'Healthy', detected: 42 },
];

export const buySellActivity = [
  { month: 'Jan', buy: 31, sell: 18 },
  { month: 'Feb', buy: 42, sell: 25 },
  { month: 'Mar', buy: 39, sell: 22 },
  { month: 'Apr', buy: 58, sell: 34 },
  { month: 'May', buy: 66, sell: 41 },
];

export const growthSeries = [
  { week: 'W1', Monstera: 12, Lily: 8, SnakePlant: 10 },
  { week: 'W2', Monstera: 16, Lily: 10, SnakePlant: 12 },
  { week: 'W3', Monstera: 21, Lily: 14, SnakePlant: 13 },
  { week: 'W4', Monstera: 26, Lily: 17, SnakePlant: 16 },
  { week: 'W5', Monstera: 31, Lily: 21, SnakePlant: 18 },
];

export const salesTrend = [
  { month: 'Jan', sales: 32000, orders: 31, predictions: 180 },
  { month: 'Feb', sales: 41000, orders: 42, predictions: 210 },
  { month: 'Mar', sales: 38000, orders: 39, predictions: 245 },
  { month: 'Apr', sales: 56000, orders: 58, predictions: 288 },
  { month: 'May', sales: 63000, orders: 66, predictions: 330 },
];
