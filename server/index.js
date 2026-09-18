const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const db = new Database(process.env.DB_PATH || '/data/hub.db');

db.exec(`CREATE TABLE IF NOT EXISTS connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_system TEXT NOT NULL,
  to_system TEXT NOT NULL,
  from_region TEXT,
  to_region TEXT,
  jumps INTEGER DEFAULT 0,
  signature TEXT,
  type TEXT DEFAULT 'Wormhole',
  size TEXT DEFAULT 'Large',
  lifetime TEXT DEFAULT 'Fresh',
  pilot TEXT,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

const count = db.prepare('SELECT COUNT(*) AS c FROM connections').get().c;
if (!count) {
  const seed = db.prepare(`INSERT INTO connections
    (from_system,to_system,from_region,to_region,jumps,signature,type,size,lifetime,pilot,status,notes)
    VALUES (@from_system,@to_system,@from_region,@to_region,@jumps,@signature,@type,@size,@lifetime,@pilot,@status,@notes)`);
  const rows = [
    {from_system:'Thera',to_system:'Jita',from_region:'Thera',to_region:'The Forge',jumps:7,signature:'K162',type:'Wormhole',size:'Large',lifetime:'Fresh',pilot:'Scout Alpha',status:'Active',notes:'High-sec exit'},
    {from_system:'Thera',to_system:'Perigen Falls',from_region:'Thera',to_region:'The Forge',jumps:11,signature:'K162',type:'Wormhole',size:'Large',lifetime:'Stable',pilot:'Scout Beta',status:'Active',notes:'Industrial route'},
    {from_system:'Turnur',to_system:'Amarr',from_region:'Pochven',to_region:'Domain',jumps:9,signature:'K162',type:'Wormhole',size:'Medium',lifetime:'Fresh',pilot:'Scout Gamma',status:'Active',notes:'Check traffic'},
    {from_system:'Turnur',to_system:'Hek',from_region:'Pochven',to_region:'Metropolis',jumps:13,signature:'K162',type:'Wormhole',size:'Large',lifetime:'EOL',pilot:'Scout Delta',status:'Warning',notes:'End of life'},
    {from_system:'Thera',to_system:'Rens',from_region:'Thera',to_region:'Heimatar',jumps:15,signature:'K162',type:'Wormhole',size:'Large',lifetime:'Stable',pilot:'Scout Epsilon',status:'Active',notes:'Long route'}
  ];
  const tx=db.transaction(rows=>rows.forEach(seed.run.bind(seed)));
  tx(rows);
}

app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));

app.get('/api/connections',(req,res)=>{
  const {hub='All',search='',lifetime='All'}=req.query;
  let sql='SELECT * FROM connections WHERE 1=1'; const args={};
  if(hub && hub!=='All'){sql+=' AND (from_system=@hub OR to_system=@hub)';args.hub=hub;}
  if(search){sql+=' AND (from_system LIKE @s OR to_system LIKE @s OR from_region LIKE @s OR to_region LIKE @s OR pilot LIKE @s)';args.s='%'+search+'%';}
  if(lifetime && lifetime!=='All'){sql+=' AND lifetime=@lifetime';args.lifetime=lifetime;}
  sql+=' ORDER BY created_at DESC, id DESC';
  res.json(db.prepare(sql).all(args));
});

app.post('/api/connections',(req,res)=>{
  const body=req.body||{};
  const required=['from_system','to_system','signature'];
  if(required.some(k=>!String(body[k]||'').trim())) return res.status(400).json({error:'From system, To system, and Signature are required.'});
  const info=db.prepare(`INSERT INTO connections
    (from_system,to_system,from_region,to_region,jumps,signature,type,size,lifetime,pilot,status,notes)
    VALUES (@from_system,@to_system,@from_region,@to_region,@jumps,@signature,@type,@size,@lifetime,@pilot,@status,@notes)`).run({
      from_system:String(body.from_system).trim(),to_system:String(body.to_system).trim(),from_region:body.from_region||'',to_region:body.to_region||'',
      jumps:Number(body.jumps)||0,signature:String(body.signature).trim(),type:body.type||'Wormhole',size:body.size||'Large',lifetime:body.lifetime||'Fresh',pilot:body.pilot||'Anonymous Scout',status:'Active',notes:body.notes||''
    });
  res.status(201).json(db.prepare('SELECT * FROM connections WHERE id=?').get(info.lastInsertRowid));
});

app.get('/api/stats',(req,res)=>res.json({connections:db.prepare("SELECT COUNT(*) c FROM connections WHERE status='Active'").get().c,thera:db.prepare("SELECT COUNT(*) c FROM connections WHERE from_system='Thera' OR to_system='Thera'").get().c,turnur:db.prepare("SELECT COUNT(*) c FROM connections WHERE from_system='Turnur' OR to_system='Turnur'").get().c,eol:db.prepare("SELECT COUNT(*) c FROM connections WHERE lifetime='EOL'").get().c}));

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`New Eden Hub listening on :${PORT}`));
