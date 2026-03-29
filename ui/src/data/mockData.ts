import { Worker, AttendanceRecord, Expense, Material, MaterialTransaction, Project } from '../types'
import { format, subDays } from 'date-fns'

const today = format(new Date(), 'yyyy-MM-dd')
const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd')

// ------- Projects -------
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Residential Block A',
    location: 'Tashkent, Yunusabad',
    startDate: '2024-01-15',
    status: 'active',
    description: '5-floor residential building, 40 apartments',
    budget: 4500000000,
    schemas: [],
  },
  {
    id: 'proj-2',
    name: 'Commercial Center',
    location: 'Tashkent, Chilonzor',
    startDate: '2023-06-01',
    endDate: '2024-12-31',
    status: 'paused',
    description: '3-storey commercial complex with underground parking',
    budget: 12000000000,
    schemas: [],
  },
  {
    id: 'proj-3',
    name: 'Road Infrastructure',
    location: 'Tashkent Region',
    startDate: '2023-01-10',
    endDate: '2023-11-30',
    status: 'completed',
    description: '12 km asphalt road with drainage system',
    budget: 8000000000,
    schemas: [],
  },
]

// ------- Workers (proj-1) -------
export const MOCK_WORKERS: Worker[] = [
  { id: 'w1', name: 'Abdullayev Behruz',  role: 'Bricklayer',     dailyWage: 150000, phone: '+998901234567', projectId: 'proj-1' },
  { id: 'w2', name: 'Karimov Jasur',      role: 'Carpenter',      dailyWage: 140000, phone: '+998901234568', projectId: 'proj-1' },
  { id: 'w3', name: 'Toshmatov Dilshod',  role: 'Electrician',    dailyWage: 180000, phone: '+998901234569', projectId: 'proj-1' },
  { id: 'w4', name: 'Yusupov Nodir',      role: 'Plumber',        dailyWage: 160000, phone: '+998901234570', projectId: 'proj-1' },
  { id: 'w5', name: 'Rakhimov Sarvar',    role: 'General Worker', dailyWage: 100000, phone: '+998901234571', projectId: 'proj-1' },
  { id: 'w6', name: 'Mirzayev Otabek',    role: 'General Worker', dailyWage: 100000, phone: '+998901234572', projectId: 'proj-1' },
  { id: 'w7', name: 'Nazarov Farrukh',    role: 'Crane Operator', dailyWage: 200000, phone: '+998901234573', projectId: 'proj-1' },
  { id: 'w8', name: 'Holiqov Sherzod',    role: 'Welder',         dailyWage: 170000, phone: '+998901234574', projectId: 'proj-1' },
  // proj-2
  { id: 'w9',  name: 'Sobirov Anvar',     role: 'Architect',      dailyWage: 250000, phone: '+998901234575', projectId: 'proj-2' },
  { id: 'w10', name: 'Tursunov Bobur',    role: 'Bricklayer',     dailyWage: 145000, phone: '+998901234576', projectId: 'proj-2' },
]

// ------- Attendance -------
export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  // proj-1, today
  { id: 'a1', workerId: 'w1', date: today, present: true },
  { id: 'a2', workerId: 'w2', date: today, present: true },
  { id: 'a3', workerId: 'w3', date: today, present: false },
  { id: 'a4', workerId: 'w4', date: today, present: true },
  { id: 'a5', workerId: 'w5', date: today, present: true },
  { id: 'a6', workerId: 'w6', date: today, present: false },
  { id: 'a7', workerId: 'w7', date: today, present: true },
  { id: 'a8', workerId: 'w8', date: today, present: true },
  // yesterday
  { id: 'a9',  workerId: 'w1', date: yesterday, present: true },
  { id: 'a10', workerId: 'w2', date: yesterday, present: true },
  { id: 'a11', workerId: 'w3', date: yesterday, present: true },
  { id: 'a12', workerId: 'w4', date: yesterday, present: true },
  { id: 'a13', workerId: 'w5', date: yesterday, present: false },
  { id: 'a14', workerId: 'w6', date: yesterday, present: true },
  { id: 'a15', workerId: 'w7', date: yesterday, present: true },
  { id: 'a16', workerId: 'w8', date: yesterday, present: true },
  // two days ago
  { id: 'a17', workerId: 'w1', date: twoDaysAgo, present: true },
  { id: 'a18', workerId: 'w2', date: twoDaysAgo, present: false },
  { id: 'a19', workerId: 'w3', date: twoDaysAgo, present: true },
  { id: 'a20', workerId: 'w4', date: twoDaysAgo, present: true },
  { id: 'a21', workerId: 'w5', date: twoDaysAgo, present: true },
  { id: 'a22', workerId: 'w6', date: twoDaysAgo, present: true },
  { id: 'a23', workerId: 'w7', date: twoDaysAgo, present: false },
  { id: 'a24', workerId: 'w8', date: twoDaysAgo, present: true },
  // proj-2
  { id: 'a25', workerId: 'w9',  date: today, present: true },
  { id: 'a26', workerId: 'w10', date: today, present: true },
]

// ------- Expenses -------
export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', amount: 850000,  category: 'materials',  note: 'Cement - 20 bags',        date: today,       projectId: 'proj-1' },
  { id: 'e2', amount: 320000,  category: 'transport',  note: 'Delivery of steel rods',  date: today,       projectId: 'proj-1' },
  { id: 'e3', amount: 75000,   category: 'food',       note: 'Lunch for workers',        date: today,       projectId: 'proj-1' },
  { id: 'e4', amount: 1200000, category: 'equipment',  note: 'Scaffolding rental',       date: yesterday,   projectId: 'proj-1' },
  { id: 'e5', amount: 450000,  category: 'materials',  note: 'Bricks - 500 pieces',      date: yesterday,   projectId: 'proj-1' },
  { id: 'e6', amount: 180000,  category: 'utilities',  note: 'Electricity bill',         date: yesterday,   projectId: 'proj-1' },
  { id: 'e7', amount: 95000,   category: 'food',       note: 'Tea and snacks',           date: twoDaysAgo,  projectId: 'proj-1' },
  { id: 'e8', amount: 2300000, category: 'materials',  note: 'Steel rods - 1 ton',       date: twoDaysAgo,  projectId: 'proj-1' },
  { id: 'e9', amount: 650000,  category: 'labor',      note: 'Extra labor for foundation', date: twoDaysAgo, projectId: 'proj-1' },
  // proj-2
  { id: 'e10', amount: 3500000, category: 'equipment', note: 'Crane rental', date: today, projectId: 'proj-2' },
  { id: 'e11', amount: 800000,  category: 'materials', note: 'Concrete mix', date: today, projectId: 'proj-2' },
]

// ------- Materials -------
export const MOCK_MATERIALS: Material[] = [
  { id: 'm1', name: 'Cement',     unit: 'bags', minStock: 50,   projectId: 'proj-1' },
  { id: 'm2', name: 'Steel Rods', unit: 'kg',   minStock: 500,  projectId: 'proj-1' },
  { id: 'm3', name: 'Bricks',     unit: 'pcs',  minStock: 1000, projectId: 'proj-1' },
  { id: 'm4', name: 'Sand',       unit: 'm³',   minStock: 10,   projectId: 'proj-1' },
  { id: 'm5', name: 'Gravel',     unit: 'm³',   minStock: 10,   projectId: 'proj-1' },
  { id: 'm6', name: 'Timber',     unit: 'pcs',  minStock: 100,  projectId: 'proj-1' },
  { id: 'm7', name: 'Glass Wool', unit: 'rolls', minStock: 20,  projectId: 'proj-1' },
  // proj-2
  { id: 'm8', name: 'Concrete',   unit: 'm³',   minStock: 20,   projectId: 'proj-2' },
  { id: 'm9', name: 'Rebar',      unit: 'kg',   minStock: 300,  projectId: 'proj-2' },
]

// ------- Material Transactions -------
export const MOCK_TRANSACTIONS: MaterialTransaction[] = [
  // proj-1 Cement
  { id: 't1', materialId: 'm1', type: 'in',  quantity: 100, note: 'Initial stock',    date: twoDaysAgo, projectId: 'proj-1' },
  { id: 't2', materialId: 'm1', type: 'out', quantity: 30,  note: 'Floor 2 columns',  date: yesterday,  projectId: 'proj-1' },
  { id: 't3', materialId: 'm1', type: 'out', quantity: 20,  note: 'Floor 2 walls',    date: today,      projectId: 'proj-1' },
  { id: 't4', materialId: 'm1', type: 'in',  quantity: 50,  note: 'New delivery',     date: today,      projectId: 'proj-1' },
  // Steel Rods
  { id: 't5', materialId: 'm2', type: 'in',  quantity: 1000, note: 'Delivery',         date: twoDaysAgo, projectId: 'proj-1' },
  { id: 't6', materialId: 'm2', type: 'out', quantity: 250,  note: 'Foundation',       date: yesterday,  projectId: 'proj-1' },
  { id: 't7', materialId: 'm2', type: 'out', quantity: 150,  note: 'Columns floor 1',  date: today,      projectId: 'proj-1' },
  // Bricks
  { id: 't8',  materialId: 'm3', type: 'in',  quantity: 5000, note: 'First batch',     date: twoDaysAgo, projectId: 'proj-1' },
  { id: 't9',  materialId: 'm3', type: 'out', quantity: 1500, note: 'Floor 1 walls',   date: yesterday,  projectId: 'proj-1' },
  { id: 't10', materialId: 'm3', type: 'out', quantity: 800,  note: 'Floor 2 walls',   date: today,      projectId: 'proj-1' },
  // Sand
  { id: 't11', materialId: 'm4', type: 'in',  quantity: 30, note: 'Truck delivery',    date: twoDaysAgo, projectId: 'proj-1' },
  { id: 't12', materialId: 'm4', type: 'out', quantity: 8,  note: 'Mixing',            date: yesterday,  projectId: 'proj-1' },
  { id: 't13', materialId: 'm4', type: 'out', quantity: 5,  note: 'Plastering',        date: today,      projectId: 'proj-1' },
  // Gravel
  { id: 't14', materialId: 'm5', type: 'in',  quantity: 20, note: 'Delivery',          date: twoDaysAgo, projectId: 'proj-1' },
  { id: 't15', materialId: 'm5', type: 'out', quantity: 6,  note: 'Foundation fill',   date: twoDaysAgo, projectId: 'proj-1' },
  // Timber
  { id: 't16', materialId: 'm6', type: 'in',  quantity: 200, note: 'Formwork material', date: twoDaysAgo, projectId: 'proj-1' },
  { id: 't17', materialId: 'm6', type: 'out', quantity: 45,  note: 'Formwork floor 2',  date: yesterday,  projectId: 'proj-1' },
  // Glass Wool
  { id: 't18', materialId: 'm7', type: 'in', quantity: 50, note: 'Insulation stock',   date: yesterday, projectId: 'proj-1' },
  // proj-2
  { id: 't19', materialId: 'm8', type: 'in',  quantity: 80, note: 'Delivery',          date: yesterday,  projectId: 'proj-2' },
  { id: 't20', materialId: 'm8', type: 'out', quantity: 25, note: 'Foundation pour',   date: today,      projectId: 'proj-2' },
  { id: 't21', materialId: 'm9', type: 'in',  quantity: 500, note: 'Delivery',         date: yesterday,  projectId: 'proj-2' },
]
