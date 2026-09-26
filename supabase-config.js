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

// Выгрузить локальное в облако + удалить из облака то, что удалено локально.
// Порядок важен из-за связей. Пустой браузер облако не трогает (защита от затирания).
window.SB.pushAll = async function(silent){
  if(!this.enabled) return false;
  if(this._busy) return false;
  this._busy = true;
  try{
    const unis = JSON.parse(localStorage.getItem('davomat_unis') || '[]');
    const students = JSON.parse(localStorage.getItem('davomat_students') || '[]');
    const att = JSON.parse(localStorage.getItem('davomat_att') || '{}');
    if(!unis.length && !students.length) return false;
    const sIds = new Set(students.map(s => s.id));
    if(unis.length)
      await this.client.from('universities').upsert(unis.map(u => ({id: u.id, name: u.name})));
    const {data: cUnis} = await this.client.from('universities').select('id');
    const delU = (cUnis || []).map(r => r.id).filter(id => !unis.find(u => u.id === id));
    if(delU.length) await this.client.from('universities').delete().in('id', delU);
    if(students.length)
      await this.client.from('students').upsert(students.map(s => ({id: s.id, full_name: s.name, university_id: s.uniId, group_name: s.group || '', phone: s.phone || ''})));
    const {data: cSt} = await this.client.from('students').select('id');
    const delS = (cSt || []).map(r => r.id).filter(id => !sIds.has(id));
    if(delS.length) await this.client.from('students').delete().in('id', delS); // их attendance чистится каскадом
    const rows = [];
    for(const d in att) for(const sid in att[d])
      if(sIds.has(sid) && ['present','absent','late'].includes(att[d][sid])) rows.push({date: d, student_id: sid, status: att[d][sid]});
    for(let i = 0; i < rows.length; i += 200)
      if(rows.slice(i, i + 200).length) await this.client.from('attendance').upsert(rows.slice(i, i + 200), {onConflict: 'date,student_id'});
    if(!silent && typeof toast === 'function') toast('☁️ Синхронизировано!');
    return true;
  }catch(e){ console.warn('pushAll:', e); return false; }
  finally{ this._busy = false; }
};

// Полная очистка облака (кнопка «Очистить всё»)
window.SB.wipeCloud = async function(){
  if(!this.enabled) return false;
  try{
    await this.client.from('attendance').delete().neq('date', '1900-01-01');
    await this.client.from('students').delete().neq('id', '__none__');
    await this.client.from('universities').delete().neq('id', '__none__');
    return true;
  }catch(e){ console.warn('wipeCloud:', e); return false; }
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

// Загрузить из облака и СЛИТЬ с локальными (union): локальные данные не теряются,
// при конфликте побеждает облако. Перезагрузка — только если что-то реально изменилось.
window.SB.load = async function(){
  if(!this.enabled) return;
  if(sessionStorage.getItem('sb_loaded')) return;
  sessionStorage.setItem('sb_loaded', '1');
  try{
    const {data: unis} = await this.client.from('universities').select('*');
    const {data: stus} = await this.client.from('students').select('*');
    const {data: att} = await this.client.from('attendance').select('*');
    let changed = false;
    // университеты: объединение по id
    const mapU = new Map(JSON.parse(localStorage.getItem('davomat_unis') || '[]').map(u => [u.id, u]));
    (unis || []).forEach(u => mapU.set(u.id, {id: u.id, name: u.name}));
    const vU = JSON.stringify([...mapU.values()]);
    if(vU !== localStorage.getItem('davomat_unis')){ localStorage.setItem('davomat_unis', vU); changed = true; }
    // студенты: объединение по id
    const mapS = new Map(JSON.parse(localStorage.getItem('davomat_students') || '[]').map(s => [s.id, s]));
    (stus || []).forEach(s => mapS.set(s.id, {id: s.id, name: s.full_name, uniId: s.university_id, group: s.group_name || '', phone: s.phone || ''}));
    const vS = JSON.stringify([...mapS.values()]);
    if(vS !== localStorage.getItem('davomat_students')){ localStorage.setItem('davomat_students', vS); changed = true; }
    // посещаемость: объединение, при конфликте — облако
    const m = JSON.parse(localStorage.getItem('davomat_att') || '{}');
    (att || []).forEach(a => { m[a.date] = m[a.date] || {}; m[a.date][a.student_id] = a.status; });
    const vA = JSON.stringify(m);
    if(vA !== localStorage.getItem('davomat_att')){ localStorage.setItem('davomat_att', vA); changed = true; }
    if(changed) location.reload();
  }catch(e){ console.warn('load:', e); }
};
