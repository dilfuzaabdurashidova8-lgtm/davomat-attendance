// Supabase sozlash / Настройка Supabase
// 1. https://supabase.com -> New project (пароль от базы сохрани!)
// 2. SQL Editor -> New query -> вставь содержимое supabase-schema.sql -> Run
// 3. Project Settings -> API -> скопируй URL + anon key сюда вниз
// 4. Залей файлы заново на GitHub -> Vercel сам передеплоит.
// Пусто = локальный режим (всё работает без интернета, кроме CDN).

window.SUPABASE_URL = "https://dnjvllawewjptvhodenh.supabase.co"; // Project URL без /rest/v1 (Settings -> API)
window.SUPABASE_ANON_KEY = "sb_publishable_vLNc2TogmT_dbysPo0xLag_MVeBLPLA"; // publishable key (Settings -> API)

window.SB = { enabled: false, client: null, _busy: false };

(function initSB(){
  try{
    if(window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase){
      window.SB.client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      window.SB.enabled = true;
      console.log("Supabase connected");
    } else {
      console.log("Supabase off: local mode");
    }
  }catch(e){ console.warn("Supabase off:", e); }
})();

// Выгрузить ВСЁ локальное в облако (универы -> студенты -> посещаемость, порядок важен из-за связей)
window.SB.pushAll = async function(silent){
  if(!this.enabled) return false;
  if(this._busy) return false;
  this._busy = true;
  try{
    const unis = JSON.parse(localStorage.getItem('davomat_unis') || '[]');
    const students = JSON.parse(localStorage.getItem('davomat_students') || '[]');
    const att = JSON.parse(localStorage.getItem('davomat_att') || '{}');
    if(unis.length)
      await this.client.from('universities').upsert(unis.map(u => ({id: u.id, name: u.name})));
    if(students.length)
      await this.client.from('students').upsert(students.map(s => ({id: s.id, full_name: s.name, university_id: s.uniId, group_name: s.group || '', phone: s.phone || ''})));
    const rows = [];
    for(const d in att) for(const sid in att[d])
      if(['present','absent','late'].includes(att[d][sid])) rows.push({date: d, student_id: sid, status: att[d][sid]});
    for(let i = 0; i < rows.length; i += 200)
      if(rows.slice(i, i + 200).length) await this.client.from('attendance').upsert(rows.slice(i, i + 200), {onConflict: 'date,student_id'});
    if(!silent && typeof toast === 'function') toast('☁️ Синхронизировано!');
    return true;
  }catch(e){ console.warn('pushAll:', e); return false; }
  finally{ this._busy = false; }
};

// Один день посещаемости (вызывается при «Сохранить»)
window.SB.saveAttendance = async function(date, dayRec){
  if(!this.enabled) return;
  try{
    await this.pushAll(true); // сначала подтянем справочники, чтобы не ругались внешние ключи
    const rows = Object.entries(dayRec || {}).filter(([k,v]) => !k.startsWith('_') && ['present','absent','late'].includes(v))
      .map(([student_id, status]) => ({date, student_id, status}));
    if(rows.length) await this.client.from('attendance').upsert(rows, {onConflict: 'date,student_id'});
  }catch(e){ console.warn('saveAttendance:', e); }
};

// Загрузить всё из облака в localStorage (вызывается при входе)
window.SB.load = async function(){
  if(!this.enabled) return;
  try{
    const {data: unis} = await this.client.from('universities').select('*');
    const {data: stus} = await this.client.from('students').select('*');
    const {data: att} = await this.client.from('attendance').select('*');
    let changed = false;
    if(unis && unis.length){ localStorage.setItem('davomat_unis', JSON.stringify(unis.map(u => ({id: u.id, name: u.name})))); changed = true; }
    if(stus && stus.length){ localStorage.setItem('davomat_students', JSON.stringify(stus.map(s => ({id: s.id, name: s.full_name, uniId: s.university_id, group: s.group_name || '', phone: s.phone || ''})))); changed = true; }
    if(att && att.length){
      const m = {}; att.forEach(a => { m[a.date] = m[a.date] || {}; m[a.date][a.student_id] = a.status; });
      localStorage.setItem('davomat_att', JSON.stringify(m)); changed = true;
    }
    if(changed) location.reload();
  }catch(e){ console.warn('load:', e); }
};
