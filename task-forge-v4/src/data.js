export const STORAGE_KEY = 'task-forge-v4-workspace';
export const SCHEMA_VERSION = 4;
export const CATEGORIES = [
 {name:'Home',icon:'house',color:'#93b7bf',visible:true},
 {name:'Vehicles',icon:'car',color:'#a2b3d0',visible:true},
 {name:'Mountain Bikes',icon:'bike',color:'#81b5a8',visible:true},
 {name:'Outdoor & Snow',icon:'mountain',color:'#b8b59b',visible:true},
 {name:'Fitness',icon:'heart',color:'#90b6d2',visible:true},
 {name:'Finances',icon:'wallet',color:'#a8a6be',visible:true},
 {name:'Work',icon:'cpu',color:'#94a8ba',visible:true},
 {name:'Email',icon:'inbox',color:'#adbaad',visible:true},
 {name:'Inbox',icon:'inbox',color:'#8794a1',visible:true}
];
export const PROJECTS = [
 {id:'ram',name:'Ram 1500',category:'Vehicles'},
 {id:'tesla',name:'Tesla Model Y',category:'Vehicles'},
 {id:'polaris',name:'Polaris 9R',category:'Outdoor & Snow'},
 {id:'bullit',name:'Santa Cruz Bullit',category:'Mountain Bikes'},
 {id:'supreme',name:'Supreme DH',category:'Mountain Bikes'},
 {id:'garage',name:'Garage & Shed',category:'Home'},
 {id:'house',name:'Home Maintenance',category:'Home'},
 {id:'money',name:'Financial Admin',category:'Finances'}
];
export const DEMO_TASKS = [
 {id:'demo-01',title:'Inspect garage outlet wiring',category:'Home',projectId:'garage',priority:'high',status:'open',reviewed:true},
 {id:'demo-02',title:'Organize compressor fittings',category:'Home',projectId:'garage',priority:'normal',status:'completed',reviewed:true},
 {id:'demo-03',title:'Label workshop storage bins',category:'Home',projectId:'garage',priority:'normal',status:'open',reviewed:true},
 {id:'demo-04',title:'Check Ram exhaust heat shield',category:'Vehicles',projectId:'ram',priority:'high',status:'open',reviewed:true},
 {id:'demo-05',title:'Service truck brakes',category:'Vehicles',projectId:'ram',priority:'normal',status:'completed',reviewed:true},
 {id:'demo-06',title:'Inspect parking-brake adjustment',category:'Vehicles',projectId:'ram',priority:'normal',status:'open',reviewed:true},
 {id:'demo-07',title:'Update Tesla dash display',category:'Vehicles',projectId:'tesla',priority:'normal',status:'open',reviewed:true},
 {id:'demo-08',title:'Organize Tesla charging accessories',category:'Vehicles',projectId:'tesla',priority:'low',status:'completed',reviewed:true},
 {id:'demo-09',title:'Check Bullit rear brake pads',category:'Mountain Bikes',projectId:'bullit',priority:'high',status:'open',reviewed:true},
 {id:'demo-10',title:'Record suspension baseline',category:'Mountain Bikes',projectId:'bullit',priority:'normal',status:'completed',reviewed:true},
 {id:'demo-11',title:'Inspect DH fork lowers',category:'Mountain Bikes',projectId:'supreme',priority:'normal',status:'open',reviewed:true},
 {id:'demo-12',title:'Check snowmobile battery',category:'Outdoor & Snow',projectId:'polaris',priority:'normal',status:'open',reviewed:true},
 {id:'demo-13',title:'Inspect splitboard bindings',category:'Outdoor & Snow',projectId:null,priority:'low',status:'open',reviewed:true},
 {id:'demo-14',title:'Clean pellet stove',category:'Home',projectId:'house',priority:'normal',status:'completed',reviewed:true},
 {id:'demo-15',title:'Schedule finance review',category:'Finances',projectId:'money',priority:'normal',status:'open',reviewed:true},
 {id:'demo-16',title:'Check shed moisture seal',category:'Home',projectId:'garage',priority:'normal',status:'completed',reviewed:true},
 {id:'demo-17',title:'Classify imported OneNote item',category:'Inbox',projectId:null,priority:'normal',status:'open',reviewed:false},
 {id:'demo-18',title:'Replace shower fixture gasket',category:'Home',projectId:'house',priority:'low',status:'completed',reviewed:true},
];
export const DEMO_SUGGESTIONS = [
 {id:'suggest-01',type:'email',title:'Review home insurance renewal',detail:'Example email suggestion · no Gmail connection',category:'Email',projectId:'money',priority:'high',status:'pending'},
 {id:'suggest-02',type:'calendar',title:'Set aside 45 min for Ram maintenance',detail:'Example calendar suggestion · no Calendar connection',category:'Vehicles',projectId:'ram',priority:'normal',status:'pending'},
 {id:'suggest-03',type:'email',title:'Follow up on project parts order',detail:'Example email suggestion · no Gmail connection',category:'Email',projectId:null,priority:'normal',status:'pending'}
];
export const DEMO_HABITS = [
 {id:'habit-workout',name:'Strength / MTB workout',target:5,type:'workout'},
 {id:'habit-ride',name:'Mountain bike ride',target:3,type:'ride'},
 {id:'habit-review',name:'Review task dashboard',target:5,type:'habit'}
];