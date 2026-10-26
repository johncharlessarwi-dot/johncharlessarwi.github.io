const USER="johncharlessarwi-dot",API="https://api.github.com";
const featured=[
{name:"bizflow-ai",title:"BizFlow AI",category:"ai",description:"AI-assisted business management for sales, stock, expenses and business intelligence.",live:"https://bizflow-ai-xi.vercel.app/",tags:["Next.js","AI","Business intelligence"]},
{name:"fima-microfinance-management-system",title:"FIMA Microfinance Management",category:"systems",description:"A digital microfinance management platform for lending operations and financial workflows.",live:"https://fima-microfinance-management-system.vercel.app/",tags:["Next.js","Financial systems"]},
{name:"wpms",title:"WPMS — Pharmacy ERP",category:"systems",description:"A multi-branch pharmaceutical system for stock, sales, purchasing and pharmacy operations.",live:"https://wpms-ten.vercel.app/",tags:["Next.js","Prisma","PostgreSQL"]},
{name:"BHOKE-AGROVERT-SYSTEM",title:"Bhoke Agrovet System",category:"systems",description:"An agrovet management platform for products, inventory, sales and customer orders.",tags:["Inventory","Business system"]},
{name:"JOB-CRAFT-AGENTIC-AI",title:"John JobCraft AI",category:"ai",description:"An AI-powered CV and career workflow concept for stronger job applications.",tags:["AI","Career tech","Automation"]},
{name:"safe-net",title:"SafeNet",category:"systems",description:"Network access and FreeRADIUS management tooling for safer infrastructure.",tags:["Python","Flask","Networking"]},
{name:"campusconnectapp",title:"Campus Connect",category:"web",description:"A campus-focused platform to help students discover useful university information.",tags:["Web app","Student tech"]},
{name:"agentic-tourism-platform",title:"Agentic Tourism Platform",category:"ai",description:"AI-enabled tourism experiences and intelligent travel workflows.",tags:["AI","Tourism","Automation"]}
];
let projects=[],filter="all",query="";
const $=id=>document.getElementById(id);
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(path){const r=await fetch(API+path,{headers:{Accept:"application/vnd.github+json"}});if(!r.ok)throw Error("GitHub "+r.status);return r.json()}
function category(r){const s=(r.name+" "+(r.description||"")).toLowerCase();return /ai|agent|assistant|automation|bot/.test(s)?"ai":/system|management|erp|pharmacy|agrovet|microfinance|attendance|network/.test(s)?"systems":"web"}
function renderProjects(){
 const shown=projects.filter(p=>(filter==="all"||p.category===filter)&&(p.title+" "+p.description+" "+p.tags.join(" ")).toLowerCase().includes(query));
 $("count").textContent="SHOWING "+shown.length+" / "+projects.length+" PROJECTS";
 $("projects").innerHTML=shown.length?shown.map(p=>'<article class="card"><div class="cardtop"><span>'+({web:"WEB APPLICATION",ai:"AI & AUTOMATION",systems:"BUSINESS SYSTEM"}[p.category])+'</span><span>★ '+(p.stars||0)+'</span></div><h3>'+safe(p.title)+'</h3><p>'+safe(p.description||"A public software project by John Charles Sarwi. Explore the source for more details.")+'</p><div class="cardtags">'+p.tags.slice(0,3).map(t=>"<span>"+safe(t)+"</span>").join("")+'</div><div class="cardlinks"><button class="case-study-trigger" type="button" data-case-study="'+safe(p.name)+'">Case study ↗</button>'+(p.url?'<a href="'+safe(p.url)+'" target="_blank" rel="noreferrer">Source code ↗</a>':'<span>Private source</span>')+(p.live?'<a href="'+safe(p.live)+'" target="_blank" rel="noreferrer">Live preview ↗</a>':"")+'</div></article>').join(""):'<div class="empty">No projects match your search.</div>';
}
async function loadProjects(){
 try{
  const [profile,repos]=await Promise.all([api("/users/"+USER),api("/users/"+USER+"/repos?type=public&sort=updated&per_page=100")]);
  $("repos").textContent=profile.public_repos;$("followers").textContent=profile.followers;$("stars").textContent=repos.reduce((n,r)=>n+r.stargazers_count,0);$("sync").textContent="LIVE DATA · GITHUB PROFILE SYNCED";
  const map=new Map(repos.map(r=>[r.name.toLowerCase(),r]));
  const top=featured.map(p=>{const r=map.get(p.name.toLowerCase());return {...p,url:r?.html_url||null,stars:r?.stargazers_count||0,updated_at:r?.updated_at||null}});
  const names=new Set(featured.map(p=>p.name.toLowerCase()));
  const rest=repos.filter(r=>!names.has(r.name.toLowerCase())).map(r=>({name:r.name,title:r.name.replace(/[-_]/g," ").replace(/\b\w/g,c=>c.toUpperCase()),category:category(r),description:r.description||"A public repository by John Charles Sarwi. Explore the source for details.",url:r.html_url,stars:r.stargazers_count,updated_at:r.updated_at,tags:[r.language||"Software",r.fork?"Fork":"GitHub"]}));
  projects=[...top,...rest];renderProjects();
 }catch(e){$("sync").textContent="GITHUB DATA TEMPORARILY UNAVAILABLE";$("projects").innerHTML='<div class="empty">GitHub is temporarily unavailable. <a href="https://github.com/'+USER+'?tab=repositories">Browse repositories directly ↗</a></div>'}
}
async function loadEvents(){
 try{
  const events=await api("/users/"+USER+"/events/public?per_page=30");
  const list=events.filter(e=>["PushEvent","CreateEvent","PullRequestEvent","ReleaseEvent","IssuesEvent","WatchEvent","ForkEvent"].includes(e.type)).slice(0,10);
  $("events").innerHTML=list.length?list.map(e=>{
   let action="updated",detail="Public repository activity";
   if(e.type==="PushEvent"){action="pushed code to";detail=(e.payload.commits?.length||0)+" commit(s) · "+(e.payload.commits?.[0]?.message||"Code update")}
   if(e.type==="CreateEvent"){action="created in";detail="New "+(e.payload.ref_type||"repository")}
   if(e.type==="PullRequestEvent"){action="updated a pull request in";detail=e.payload.pull_request?.title||"Pull request"}
   if(e.type==="ReleaseEvent"){action="published a release in";detail=e.payload.release?.name||"New release"}
   if(e.type==="IssuesEvent"){action="updated an issue in";detail=e.payload.issue?.title||"Issue update"}
   if(e.type==="WatchEvent"){action="starred";detail="Repository received a star"}
   if(e.type==="ForkEvent"){action="had a repository forked";detail="A new public fork"}
   return '<div class="event"><time>'+new Date(e.created_at).toLocaleDateString("en",{day:"2-digit",month:"short",year:"numeric"})+'</time><div>'+safe(action)+' <a href="https://github.com/'+safe(e.repo.name)+'" target="_blank" rel="noreferrer">'+safe(e.repo.name.split("/").pop())+'</a><small>'+safe(detail)+'</small></div></div>'
  }).join(""):'<p class="empty">No recent public activity to display yet.</p>';
  $("activitytime").textContent="UPDATED "+new Date().toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"});
 }catch(e){$("events").textContent="Public activity is temporarily unavailable.";$("activitytime").textContent="OFFLINE"}
}
async function loadProjectUpdates(){
 const box=$("project-updates"),label=$("project-updates-status");
 if(!box||!label)return;
 label.textContent="CHECKING PROJECT REPOSITORIES…";
 const targets=featured.slice(0,8);
 const results=await Promise.allSettled(targets.map(async p=>{
  const r=await api("/repos/"+USER+"/"+encodeURIComponent(p.name)+"/commits?per_page=1");
  if(!r.length)return null;
  const c=r[0],commit=c.commit||{};
  return {project:p.title,repo:p.name,sha:c.sha,message:commit.message||"Code update",date:commit.author?.date||commit.committer?.date||null,url:c.html_url};
 }));
 const updates=results.filter(x=>x.status==="fulfilled"&&x.value).map(x=>x.value).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
 label.textContent=updates.length+" PROJECT REPOSITORIES · LATEST COMMIT PER PROJECT";
 box.innerHTML=updates.length?updates.map(u=>'<article class="update-card"><div class="update-top"><b>'+safe(u.project)+'</b><time>'+safe(u.date?new Date(u.date).toLocaleString("en",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Date unavailable")+'</time></div><p>'+safe(u.message.split("\\n")[0])+'</p><a href="'+safe(u.url)+'" target="_blank" rel="noreferrer">View commit · '+safe(u.sha.slice(0,7))+' ↗</a></article>').join(""):'<p class="empty">No recent commit details could be loaded for the featured repositories.</p>';
}
function timeAgo(value){const d=Date.now()-new Date(value).getTime(),m=Math.max(0,Math.floor(d/60000));if(m<60)return m+"m ago";if(m<1440)return Math.floor(m/60)+"h ago";return Math.floor(m/1440)+"d ago"}
async function loadDeployments(){
 const list=$("deployments-list"),status=$("deploy-status");
 if(!list||!status)return;
 status.textContent="CHECKING DELIVERY ACTIVITY…";
 try{
  const r=await fetch("/api/deployments",{headers:{Accept:"application/json"},cache:"no-store"});
  if(r.status===503){
   status.textContent="DELIVERY ACTIVITY UNAVAILABLE";
   list.innerHTML='<div class="empty">Public workflow activity is temporarily unavailable. Please refresh in a moment.</div>';
   return;
  }
  if(!r.ok)throw Error("Deployment feed unavailable");
  const data=await r.json(),items=data.deployments||[];
  status.textContent="LIVE GITHUB ACTIONS · "+items.length+" RECENT WORKFLOW RUNS";
  list.innerHTML=items.length?items.map(d=>{
   const state=String(d.state||"unknown").toLowerCase(),name=d.projectName||d.project||"Portfolio workflow";
   const title=d.commitMessage||"Workflow run";
   const shortSha=d.commitSha?d.commitSha.slice(0,7):"source";
   const href=d.url?(d.url.startsWith("http")?d.url:"https://"+d.url):null;
   return '<article class="deploy-card"><div class="deploy-card-top"><span>'+safe(name)+'</span><span class="deploy-state '+safe(state)+'">'+safe(d.state||"UNKNOWN")+'</span></div><h3>'+safe(title)+'</h3><p>'+(d.branch?"Branch: "+safe(d.branch)+" · ":"")+safe(d.commitRef||"Workflow run")+'</p><div class="deploy-meta"><span>'+safe(shortSha)+' · '+safe(timeAgo(d.createdAt))+'</span>'+(href?'<a href="'+safe(href)+'" target="_blank" rel="noreferrer">View workflow ↗</a>':"<span>URL unavailable</span>")+'</div></article>'
  }).join(""):'<div class="empty">No recent GitHub Actions workflow runs were returned.</div>';
 }catch(e){status.textContent="DELIVERY ACTIVITY UNAVAILABLE";list.innerHTML='<div class="empty">The public workflow feed could not be loaded. Check GitHub Actions and refresh shortly.</div>'}
}
async function submitProject(e){
 e.preventDefault();
 const form=e.currentTarget,status=$("form-status"),button=$("submit-project");
 const data=Object.fromEntries(new FormData(form).entries());
 if(data.website){status.textContent="Unable to submit this request.";return}
 button.disabled=true;button.textContent="Sending request…";status.textContent="Sending securely…";
 try{
  const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(result.error||"Unable to send your request right now.");
  form.reset();status.textContent="Request received successfully. Your reference number is "+(result.orderId||"pending confirmation")+". A confirmation email will be sent to you.";
 }catch(err){status.textContent=err.message+" You can also email johncharlessarwi@gmail.com directly."}
 finally{button.disabled=false;button.textContent="Send project request ↗"}
}
const caseDialog=$("case-study-dialog");
$("projects").addEventListener("click",e=>{
 const trigger=e.target.closest("[data-case-study]");if(!trigger)return;
 const p=projects.find(x=>x.name===trigger.dataset.caseStudy);if(!p||!caseDialog)return;
 $("case-study-category").textContent=({web:"WEB APPLICATION",ai:"AI & AUTOMATION",systems:"BUSINESS SYSTEM"}[p.category]||"PROJECT");
 $("case-study-title").textContent=p.title;
 $("case-study-summary").textContent=p.description||"A public software project by John Charles Sarwi.";
 $("case-study-tags").innerHTML=(p.tags||[]).map(t=>"<span>"+safe(t)+"</span>").join("");
 $("case-study-repository").textContent=p.name;
 $("case-study-updated").textContent=p.updated_at?"Repository last updated "+new Date(p.updated_at).toLocaleDateString():"Explore the source repository for implementation details.";
 $("case-study-links").innerHTML=(p.live?'<a class="primary" href="'+safe(p.live)+'" target="_blank" rel="noreferrer">Open live project ↗</a>':"")+(p.url?'<a class="secondary" href="'+safe(p.url)+'" target="_blank" rel="noreferrer">Explore source ↗</a>':"");
 caseDialog.showModal();
});
$("case-study-close").addEventListener("click",()=>caseDialog.close());
caseDialog.addEventListener("click",e=>{if(e.target===caseDialog)caseDialog.close()});
$("filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;filter=b.dataset.filter;document.querySelectorAll("#filters button").forEach(x=>x.classList.toggle("active",x===b));renderProjects()});
$("search").addEventListener("input",e=>{query=e.target.value.toLowerCase().trim();renderProjects()});
$("menu").addEventListener("click",()=>$("nav").classList.toggle("open"));
document.querySelectorAll("#nav a").forEach(a=>a.addEventListener("click",()=>$("nav").classList.remove("open")));
$("refresh-deployments")?.addEventListener("click",loadDeployments);
const projectForm=$("project-form");
if(projectForm){
 const budgetField=projectForm.querySelector('[name="budget"]')?.closest("label");
 if(budgetField){
  budgetField.insertAdjacentHTML("afterend",'<label>EXPECTED TIMELINE<select name="timeline"><option value="">Choose expected timeline</option><option>As soon as possible</option><option>Within 1–2 weeks</option><option>Within 1 month</option><option>Within 1–3 months</option><option>Flexible / to be discussed</option></select></label><label>PREFERRED CONTACT<select name="contactPreference"><option value="">Email or phone</option><option>Email</option><option>WhatsApp</option><option>Phone call</option></select></label>');
 }
 projectForm.addEventListener("submit",submitProject);
}
$("year").textContent=new Date().getFullYear();
if ($("form-started-at")) $("form-started-at").value=String(Date.now());
loadProjects();loadEvents();loadDeployments();loadProjectUpdates();
setInterval(loadEvents,300000);setInterval(loadDeployments,300000);
