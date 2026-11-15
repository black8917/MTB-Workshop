export const CATEGORIES = [
  { name: 'Home & Garage', short: 'HOME', icon: 'house', color: '#6fcba9' },
  { name: 'Bikes', short: 'BIKES', icon: 'bike', color: '#63c7ee' },
  { name: 'Vehicles', short: 'VEHICLES', icon: 'car', color: '#a8b9ff' },
  { name: 'Outdoor & Snow', short: 'OUTDOORS', icon: 'mountain', color: '#e8b875' },
  { name: 'Finance & Admin', short: 'FINANCES', icon: 'wallet', color: '#c7a9f8' },
  { name: 'Personal & Health', short: 'PERSONAL', icon: 'heart', color: '#f199a4' },
  { name: 'Work & Projects', short: 'WORK', icon: 'cpu', color: '#81b4fe' },
  { name: 'Errands & Shopping', short: 'ERRANDS', icon: 'shopping', color: '#eac68b' },
  { name: 'Inbox', short: 'UNSORTED', icon: 'inbox', color: '#8798aa' },
];

// Deliberately generic. NEVER bundle imported private task data into a public deployment.
export const DEMO_TASKS = [
  {id:'demo-1',title:'Import your OneNote task data',category:'Inbox',priority:'high',status:'open',reviewed:true,notes:'Use Import to load the private JSON file supplied separately.',dueDate:null},
  {id:'demo-2',title:'Review and categorize imported tasks',category:'Work & Projects',priority:'normal',status:'open',reviewed:true,notes:'Items imported as unchecked start in the review queue.',dueDate:null},
  {id:'demo-3',title:'Install dashboard on iPhone Home Screen',category:'Personal & Health',priority:'normal',status:'open',reviewed:true,notes:'After hosting over HTTPS, use Safari > Share > Add to Home Screen.',dueDate:null},
  {id:'demo-4',title:'Configure private cloud sync in a future release',category:'Work & Projects',priority:'low',status:'open',reviewed:true,notes:'Supabase authentication with Row Level Security is planned, not included in v1.',dueDate:null},
];
export const SCHEMA_VERSION = 2;
export const STORAGE_KEY = 'task-forge-v1';