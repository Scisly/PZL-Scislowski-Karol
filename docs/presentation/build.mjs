import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Use the artifact-tool installation supplied by load_workspace_dependencies.
// No npm dependency is downloaded or installed by this source.
const here = path.dirname(fileURLToPath(import.meta.url));
const moduleRoot = process.env.ARTIFACT_TOOL_MODULES;
if (!moduleRoot) throw new Error('Set ARTIFACT_TOOL_MODULES to the bundled node_modules path.');
const { Presentation, PresentationFile } = await import(pathToFileURL(path.join(moduleRoot, '@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const out = path.join(here, '.build');
await fs.mkdir(out, { recursive: true });
const slides = JSON.parse(await fs.readFile(path.join(here, 'slides.json'), 'utf8'));
await fs.writeFile(path.join(here,'SPEAKER_NOTES.md'),'# Notatki do prezentacji TaskFlow\n\n'+slides.map((s,i)=>`## ${i+1}. ${s.title}\n\n${s.notes}\n`).join('\n'));
const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const c = { ink: '#11293A', muted: '#51616D', teal: '#147D75', paper: '#F6F7F4', line: '#CFD7D8', white: '#FFFFFF' };
const font = 'Arial';
function text(s, value, x, y, w, h, size=29, color=c.ink, bold=false) {
  const t = s.shapes.add({ geometry: 'textbox', position: { left:x, top:y, width:w, height:h }, fill:'none', line: { fill:'none', width:0 } });
  t.text = value;
  t.text.style = { fontFamily:font, fontSize:size, color, bold };
  t.text.insets = 0;
  return t;
}
function line(s,x,y,w,color=c.line,width=2) {
  return s.shapes.add({ geometry:'line', position:{left:x,top:y,width:w,height:0}, line:{fill:color,width} });
}
function box(s,label,x,y,w=300,h=100) {
  const b=s.shapes.add({ geometry:'rect', position:{left:x,top:y,width:w,height:h}, fill:c.white, line:{fill:c.teal,width:2} });
  text(s,label,x+20,y+27,w-40,h-36,27,c.ink,true);
  return b;
}
function link(s,a,b,from='right',to='left') { s.shapes.connect(a,b,{kind:'straight',fromSide:from,toSide:to,line:{fill:c.teal,width:3},tail:{type:'arrow',width:'med',length:'med'}}); }
function title(s,d,i) {
  s.background.fill=c.paper;
  text(s,d.title,72,54,1100,68,46,c.ink,true);
  text(s,d.subtitle,72,138,1110,66,27,c.muted);
  line(s,72,216,1136);
  text(s,String(i+1).padStart(2,'0'),1170,657,45,27,18,c.muted);
}
function rows(s,items,start=257,step=110,firstWidth=250,bodySize=29) {
  items.forEach(([a,b],j)=>{
    const y=start+j*step;
    text(s,a,72,y,firstWidth,56,bodySize,c.teal,true);
    text(s,b,72+firstWidth+38,y,1098-firstWidth-38,72,bodySize,c.ink);
    if(j<items.length-1) line(s,72,y+step-22,1136,c.line,1);
  });
}
for(const [i,d] of slides.entries()) {
  const s=p.slides.add();
  s.speakerNotes.text=d.notes;
  if(d.layout==='cover') {
    s.background.fill=c.ink;
    text(s,d.title,72,130,1120,120,88,c.white,true);
    text(s,d.subtitle,77,280,1080,110,40,'#9ED8D1');
    text(s,d.body[0],77,510,1000,50,30,c.white,true);
    text(s,d.body[1].replace(' • ',' / '),77,565,1100,40,24,'#C6D4DB');
    text(s,d.body[2],77,613,1000,35,21,'#C6D4DB');
    continue;
  }
  title(s,d,i);
  if(d.layout==='numbered') {
    rows(s,d.items,267,114,210);
  } else if(d.layout==='api') {
    rows(s,d.items,252,78,470,25);
  } else if(d.layout==='errors') {
    rows(s,d.items,252,82,300,28);
  } else if(d.layout==='integration') {
    rows(s,d.items,252,88,240,28);
  } else if(d.layout==='split') {
    text(s,d.leftTitle,72,261,530,50,32,c.teal,true);
    text(s,d.rightTitle,680,261,528,50,32,c.teal,true);
    d.left.forEach((v,j)=>text(s,v,72,340+j*83,525,70,28));
    d.right.forEach((v,j)=>text(s,v,680,340+j*83,528,70,28));
  } else if(d.layout==='architecture') {
    const a=box(s,'React + TypeScript',72,285,320,105);
    const b=box(s,'ASP.NET Core 10',478,285,320,105);
    const db=box(s,'PostgreSQL 18',884,285,324,105);
    link(s,a,b);link(s,b,db);
    const domain=box(s,'Domain',478,487,320,90);
    link(s,b,domain,'bottom','top');
    text(s,'Reguły bez EF i Identity',478,591,350,42,23,c.muted);
    text(s,'HTTP + DTO',114,415,260,40,23,c.muted);
    text(s,'EF Core + Npgsql',900,415,308,40,23,c.muted);
    text(s,'Adapter kalendarza: IHolidayClient',72,538,365,76,26,c.teal,true);
  } else if(d.layout==='domain') {
    const project=box(s,'Project',72,285,285,90);
    const task=box(s,'TaskItem',498,285,285,90);
    const comment=box(s,'Comment',923,285,285,90);
    link(s,project,task); link(s,task,comment);
    text(s,'1 : wiele',385,287,110,30,21,c.muted);
    text(s,'1 : wiele',810,287,110,30,21,c.muted);
    const member=box(s,'ProjectMember',72,507,285,90);
    const user=box(s,'ApplicationUser',498,507,285,90);
    link(s,project,member,'bottom','top'); link(s,user,member,'left','right');
    text(s,'Klucz: ProjectId + UserId',72,618,520,40,24,c.teal,true);
    text(s,'Identity oraz role',923,513,285,80,27,c.muted);
    text(s,'Właściciel, autor, przypisanie: osobne FK',498,618,710,40,24,c.muted);
  } else if(d.layout==='deployment') {
    const a=box(s,d.body[0],72,310,320,110);
    const b=box(s,d.body[1],478,310,320,110);
    const z=box(s,d.body[2],884,310,324,110);
    link(s,a,b);link(s,b,z);
    text(s,'CI: backend i frontend, potem Compose + smoke + Playwright',72,486,1136,100,32,c.ink,true);
  } else if(d.layout==='closing') {
    rows(s,d.items,264,104,55,30);
  }
  if(d.caption) {
    const size=d.layout==='deployment'?23:25;
    text(s,d.caption,72,623,1090,50,size,c.teal,true);
  }
}
await fs.writeFile(path.join(out,'presentation.json'),JSON.stringify(p.toProto()));
for(const [i,s] of p.slides.items.entries()) {
  const png=await p.export({slide:s,format:'png',scale:2});
  await fs.writeFile(path.join(out,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
  const layout=await s.export({format:'layout'});
  await fs.writeFile(path.join(out,`slide-${String(i+1).padStart(2,'0')}.layout.json`),await layout.text());
}
await (await PresentationFile.exportPptx(p)).save(path.join(out,'candidate.pptx'));
console.log(JSON.stringify({slides:slides.length,candidate:path.join(out,'candidate.pptx'),renders:out}));
