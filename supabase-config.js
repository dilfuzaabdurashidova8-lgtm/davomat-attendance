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

// Один день посещаемости (вызывается при «Сохранить»): грузим только затронутые справочники + день
window.SB.saveAttendance = async function(date, dayRec){
  if(!this.enabled) return;
  try{
    const students = JSON.parse(localStorage.getItem('davomat_students') || '[]');
    const unis = JSON.parse(localStorage.getItem('davomat_unis') || '[]');
    const ids = Object.keys(dayRec || {}).filter(k => !k.startsWith('_'));
    const usedStudents = students.filter(s => ids.includes(s.id));
    const usedUniIds = [...new Set(usedStudents.map(s => s.uniId))];
    const usedUnis = unis.filter(u => usedUniIds.includes(u.id));
    if(usedUnis.length)
      await this.client.from('universities').upsert(usedUnis.map(u => ({id: u.id, name: u.name})));
    if(usedStudents.length)
      await this.client.from('students').upsert(usedStudents.map(s => ({id: s.id, full_name: s.name, university_id: s.uniId, group_name: s.group || '', phone: s.phone || ''})));
    const rows = ids.filter(sid => ['present','absent','late'].includes(dayRec[sid]))
      .map(sid => ({date, student_id: sid, status: dayRec[sid]}));
    if(rows.length) await this.client.from('attendance').upsert(rows, {onConflict: 'date,student_id'});
  }catch(e){ console.warn('saveAttendance:', e); }
};

// Загрузить всё из облака в localStorage (вызывается при входе).
// Перезагружаем страницу ТОЛЬКО если данные реально отличаются — иначе был вечный цикл перезагрузок.
window.SB.load = async function(){
  if(!this.enabled) return;
  if(sessionStorage.getItem('sb_loaded')) return;
  sessionStorage.setItem('sb_loaded', '1');
  try{
    const {data: unis} = await this.client.from('universities').select('*');
    const {data: stus} = await this.client.from('students').select('*');
    const {data: att} = await this.client.from('attendance').select('*');
    let changed = false;
    if(unis && unis.length){
      const v = JSON.stringify(unis.map(u => ({id: u.id, name: u.name})));
      if(v !== localStorage.getItem('davomat_unis')){ localStorage.setItem('davomat_unis', v); changed = true; }
    }
    if(stus && stus.length){
      const v = JSON.stringify(stus.map(s => ({id: s.id, name: s.full_name, uniId: s.university_id, group: s.group_name || '', phone: s.phone || ''})));
      if(v !== localStorage.getItem('davomat_students')){ localStorage.setItem('davomat_students', v); changed = true; }
    }
    if(att && att.length){
      const m = {}; att.forEach(a => { m[a.date] = m[a.date] || {}; m[a.date][a.student_id] = a.status; });
      const v = JSON.stringify(m);
      if(v !== localStorage.getItem('davomat_att')){ localStorage.setItem('davomat_att', v); changed = true; }
    }
    if(changed) location.reload();
  }catch(e){ console.warn('load:', e); }
};
