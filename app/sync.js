// Real-time team sync (Firestore). Works offline: edits are cached and pushed when internet returns.
window.Sync = (() => {
  let db, on = false; const me = Math.random().toString(36).slice(2);
  let remoteUsers = [];
  const CH = 400000;
  async function init() {
    const c = window.FIREBASE_CONFIG;
    if (!c || String(c.apiKey).startsWith('PASTE') || !window.firebase) return false;
    firebase.initializeApp(c);
    try { await firebase.auth().signInAnonymously(); } catch (e) { console.warn('auth', e); }
    db = firebase.firestore();
    try { await db.enablePersistence({ synchronizeTabs: true }); } catch (e) {}
    on = true;
    window.addEventListener('online', () => window.electronAPI && window.electronAPI.checkUpdates());
    return true;
  }
  const badge = (t, ok) => { const b = document.getElementById('syncBadge'); if (b) { b.textContent = t; b.className = 'text-[10px] font-bold px-2 py-0.5 rounded ' + (ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'); } };
  async function getUsers() {
    if (!on) return [];
    const s = await Promise.race([db.collection('users').get(), new Promise(r => setTimeout(() => r(null), 5000))]);
    remoteUsers = s ? s.docs.map(d => d.data()) : [];
    return remoteUsers;
  }
  function pushUsers(users) {
    if (!on) return;
    const b = db.batch(), keep = new Set(users.map(u => u.username.toLowerCase()));
    users.forEach(u => b.set(db.collection('users').doc(u.username.toLowerCase()), JSON.parse(JSON.stringify(u))));
    remoteUsers.forEach(u => { if (!keep.has(u.username.toLowerCase())) b.delete(db.collection('users').doc(u.username.toLowerCase())); });
    remoteUsers = users.slice(); b.commit();
  }
  function pushNote(po, isRemoved, comment, by) {
    if (!on) return;
    db.collection('notes').doc(String(po).replace(/\//g, '_')).set({ po: String(po), isRemoved: !!isRemoved, comment: comment || '', by: by || '', at: Date.now() });
  }
  async function pushInventory(rows) {
    if (!on) return;
    const s = JSON.stringify(rows), n = Math.ceil(s.length / CH), b = db.batch();
    for (let i = 0; i < n; i++) b.set(db.collection('inventory').doc('c' + i), { data: s.slice(i * CH, (i + 1) * CH) });
    b.set(db.collection('inventory').doc('meta'), { chunks: n, by: me, at: Date.now() });
    await b.commit();
  }
  function listen({ onNotes, onInventory }) {
    if (!on) return;
    db.collection('notes').onSnapshot(s => {
      const ch = s.docChanges().filter(c => !c.doc.metadata.hasPendingWrites).map(c => c.doc.data());
      if (ch.length) onNotes(ch);
      badge(s.metadata.fromCache ? 'OFFLINE · cached' : 'LIVE', !s.metadata.fromCache);
    });
    db.collection('inventory').doc('meta').onSnapshot(async m => {
      if (!m.exists || m.metadata.hasPendingWrites || m.data().by === me) return;
      const s = await db.collection('inventory').get(), parts = {};
      s.docs.forEach(d => { if (d.id !== 'meta') parts[d.id] = d.data().data; });
      let str = ''; for (let i = 0; i < m.data().chunks; i++) str += parts['c' + i] || '';
      try { onInventory(JSON.parse(str)); } catch (e) { console.error(e); }
    });
  }
  return { init, getUsers, pushUsers, pushNote, pushInventory, listen, get enabled() { return on; } };
})();
