// Supabase sozlash / Настройка Supabase
// 1. https://supabase.com -> New project
// 2. SQL Editor -> supabase-schema.sql ni ishga tushiring
// 3. Settings -> API -> URL + anon key ni pastga qo'ying
// 4. Vercel ga deploy qiling. Bo'sh qolsa - lokal rejimda ishlaydi.

window.SUPABASE_URL = ""; // masalan: "https://xyz.supabase.co"
window.SUPABASE_ANON_KEY = ""; // anon public key

window.SB = { enabled: false, client: null };

(function initSB(){
  try{
    if(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase){
      window.SB.client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      window.SB.enabled = true;
      console.log("Supabase connected");
    }
  }catch(e){ console.warn("Supabase off:", e); }
})();

// Ixtiyoriy sinxron (sodda variant): saqlash/yuklash
window.SB.saveAttendance = async function(date, draft){
  if(!this.enabled) return;
  try{
    const rows = Object.entries(draft).filter(([k])=>!k.startsWith('_')).map(([student_id,status])=>({date, student_id, status}));
    if(!rows.length) return;
    await this.client.from('attendance').upsert(rows, {onConflict:'date,student_id'});
  }catch(e){ console.warn(e); }
};
window.SB.load = async function(){
  if(!this.enabled) return;
  try{
    const {data:unis} = await this.client.from('universities').select('*');
    const {data:stus} = await this.client.from('students').select('*');
    const {data:att} = await this.client.from('attendance').select('*');
    if(unis?.length){ localStorage.setItem('davomat_unis', JSON.stringify(unis.map(u=>({id:u.id,name:u.name})))); }
    if(stus?.length){ localStorage.setItem('davomat_students', JSON.stringify(stus.map(s=>({id:s.id,name:s.full_name,uniId:s.university_id,group:s.group_name,phone:s.phone})))); }
    if(att?.length){ const m={}; att.forEach(a=>{m[a.date]=m[a.date]||{};m[a.date][a.student_id]=a.status;}); localStorage.setItem('davomat_att', JSON.stringify(m)); }
    if(unis?.length||stus?.length) location.reload();
  }catch(e){ console.warn(e); }
};
