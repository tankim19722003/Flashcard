const STORAGE_KEY = 'hanzi-flashcards-v1';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const starterData = { collections: [{ id: 'starter', name: 'Từ vựng cơ bản', cards: [
  { id: uid(), front: '你好', back: 'nǐ hǎo\nxin chào', style: 'paper' },
  { id: uid(), front: '谢谢', back: 'xiè xie\ncảm ơn', style: 'sage' },
  { id: uid(), front: '朋友', back: 'péng you\nbạn bè', style: 'peach' }
]}] };
let data = loadData();
let activeId = data.collections[0]?.id || null;
let cardIndex = 0;
let flipped = false;
let view = 'study';
let editingCardId = null;
let editingCollection = false;
let toastTimer;

function loadData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && Array.isArray(parsed.collections)) return parsed;
  } catch (error) { console.warn('Không đọc được dữ liệu flashcard:', error); }
  return structuredClone(starterData);
}
function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); $('.save-state').innerHTML = '<i></i> Đã lưu trên thiết bị'; }
  catch (error) { $('.save-state').innerHTML = '<i style="background:#c47b5a"></i> Không thể lưu'; toast('Bộ nhớ trình duyệt đã đầy. Hãy xuất dữ liệu để sao lưu.'); }
}
function currentCollection() { return data.collections.find((item) => item.id === activeId) || null; }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2400); }
function render() { renderCollections(); renderContent(); saveData(); }
function renderCollections() {
  const list = $('#collectionList');
  if (!data.collections.length) { list.innerHTML = '<div class="collection-empty">Chưa có bộ sưu tập</div>'; return; }
  list.innerHTML = data.collections.map((collection, index) => `<div class="collection-item ${collection.id === activeId ? 'active' : ''}" data-collection="${escapeHtml(collection.id)}"><span class="collection-icon">${index % 2 ? '◈' : '▧'}</span><span>${escapeHtml(collection.name)}</span><span class="collection-count">${collection.cards.length}</span></div>`).join('');
  $$('.collection-item').forEach((item) => item.addEventListener('click', () => { activeId = item.dataset.collection; cardIndex = 0; flipped = false; render(); }));
}
function renderContent() {
  const collection = currentCollection();
  const hasCollection = !!collection;
  $('#contentArea').classList.toggle('content-empty', !hasCollection);
  $('#collectionTitle').textContent = collection?.name || 'Chưa có bộ sưu tập';
  $('#collectionMeta').textContent = collection ? `${collection.cards.length} flashcard · ${collection.cards.length ? 'Ôn tập theo nhịp của bạn' : 'Bắt đầu thêm từ mới nhé'}` : 'Tạo bộ sưu tập đầu tiên để bắt đầu';
  $('#addCardBtn').disabled = !hasCollection;
  $('#editCollectionBtn').style.visibility = hasCollection ? 'visible' : 'hidden';
  $('#deleteCollectionBtn').style.visibility = hasCollection ? 'visible' : 'hidden';
  $('#studyView').classList.toggle('hidden', view !== 'study');
  $('#allView').classList.toggle('hidden', view !== 'all');
  if (!hasCollection) { $('#studyView').innerHTML = '<div class="empty-state"><div class="empty-illustration">集</div><h3>Bắt đầu bộ sưu tập đầu tiên</h3><p>Tập hợp từ vựng theo chủ đề, giáo trình hay bất kỳ cách nào phù hợp với bạn.</p><button class="primary-btn" id="emptyCollectionBtn">+ Tạo bộ sưu tập</button></div>'; $('#emptyCollectionBtn').onclick = openNewCollection; $('#allView').innerHTML = ''; return; }
  renderStudy(collection); renderAllCards(collection);
}
function renderStudy(collection) {
  const target = $('#studyView');
  if (!collection.cards.length) { target.innerHTML = '<div class="empty-state"><div class="empty-illustration">新</div><h3>Một trang giấy mới</h3><p>Thêm flashcard đầu tiên vào bộ sưu tập này. Chỉ mặt trước sẽ hiện khi ôn tập.</p><button class="primary-btn" id="emptyCardBtn">+ Thêm flashcard</button></div>'; $('#emptyCardBtn').onclick = () => openCardDialog(); return; }
  cardIndex = ((cardIndex % collection.cards.length) + collection.cards.length) % collection.cards.length;
  const card = collection.cards[cardIndex];
  const progress = ((cardIndex + 1) / collection.cards.length) * 100;
  target.innerHTML = `<div class="study-topline"><span>${String(cardIndex + 1).padStart(2, '0')} / ${String(collection.cards.length).padStart(2, '0')}</span><div class="progress-track"><i style="width:${progress}%"></i></div><span>FLASHCARD</span></div><div class="flashcard ${escapeHtml(card.style || 'paper')} ${flipped ? 'flipped-state' : ''}" id="studyCard" role="button" tabindex="0" aria-label="Thẻ ${flipped ? 'mặt sau' : 'mặt trước'}, bấm để lật"><span class="card-corner"></span><span class="card-toplabel">${flipped ? 'NGHĨA · PINYIN' : escapeHtml(collection.name)}</span><div class="${flipped ? 'card-back' : 'card-front'}">${escapeHtml(flipped ? card.back : card.front).replace(/\n/g, '<br>')}</div><span class="card-hint">${flipped ? 'BẤM ĐỂ XEM LẠI TỪ' : 'BẤM ĐỂ LẬT THẺ  ↗'}</span></div><div class="card-actions"><button class="round-action" id="prevCard" aria-label="Thẻ trước">←</button><div class="study-center"><button class="secondary-btn" id="shuffleBtn">⇄　Trộn thẻ</button><button class="primary-btn" id="nextCard">Tiếp theo　→</button></div><button class="round-action" id="nextCardSmall" aria-label="Thẻ tiếp theo">→</button></div>`;
  const flashcard = $('#studyCard');
  const flip = () => { flipped = !flipped; renderStudy(collection); };
  flashcard.addEventListener('click', flip); flashcard.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); flip(); } });
  const move = (delta) => { cardIndex += delta; flipped = false; renderStudy(collection); };
  $('#prevCard').onclick = () => move(-1); $('#nextCard').onclick = () => move(1); $('#nextCardSmall').onclick = () => move(1);
  $('#shuffleBtn').onclick = () => { if (collection.cards.length > 1) { const old = cardIndex; while (cardIndex === old) cardIndex = Math.floor(Math.random() * collection.cards.length); flipped = false; renderStudy(collection); } else toast('Thêm vài thẻ để trộn nhé.'); };
}
function renderAllCards(collection) {
  const target = $('#allView');
  if (!collection.cards.length) { target.innerHTML = '<div class="empty-state"><div class="empty-illustration">空</div><h3>Chưa có flashcard</h3><p>Thẻ mới sẽ xuất hiện tại đây.</p></div>'; return; }
  target.innerHTML = collection.cards.map((card) => `<article class="mini-card ${escapeHtml(card.style || 'paper')}" data-card="${escapeHtml(card.id)}" tabindex="0"><div class="mini-actions"><button data-edit="${escapeHtml(card.id)}" aria-label="Sửa flashcard">Sửa</button><button data-delete="${escapeHtml(card.id)}" aria-label="Xoá flashcard">Xoá</button></div><div class="mini-front">${escapeHtml(card.front)}</div><div class="mini-back">${escapeHtml(card.back).replace(/\n/g, ' · ')}</div></article>`).join('');
  $$('.mini-card').forEach((item) => { item.addEventListener('click', (event) => { if (event.target.closest('button')) return; const id = item.dataset.card; cardIndex = collection.cards.findIndex((card) => card.id === id); flipped = false; view = 'study'; $$('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view)); renderContent(); }); });
  $$('[data-edit]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); openCardDialog(button.dataset.edit); }));
  $$('[data-delete]').forEach((button) => button.addEventListener('click', (event) => { event.stopPropagation(); deleteCard(button.dataset.delete); }));
}
function openNewCollection() { editingCollection = false; $('#collectionDialogTitle').textContent = 'Bộ sưu tập mới'; $('#collectionName').value = ''; $('#saveCollectionBtn').textContent = 'Tạo bộ sưu tập'; $('#collectionDialog').showModal(); setTimeout(() => $('#collectionName').focus(), 50); }
function openEditCollection() { const collection = currentCollection(); if (!collection) return; editingCollection = true; $('#collectionDialogTitle').textContent = 'Đổi tên bộ sưu tập'; $('#collectionName').value = collection.name; $('#saveCollectionBtn').textContent = 'Lưu thay đổi'; $('#collectionDialog').showModal(); setTimeout(() => $('#collectionName').focus(), 50); }
function deleteCollection() {
  const collection = currentCollection();
  if (!collection) return;
  const confirmed = window.confirm(`Xoá bộ sưu tập “${collection.name}” và toàn bộ ${collection.cards.length} flashcard bên trong?`);
  if (!confirmed) return;
  data.collections = data.collections.filter((item) => item.id !== collection.id);
  activeId = data.collections[0]?.id || null;
  cardIndex = 0;
  flipped = false;
  render();
  toast('Đã xoá bộ sưu tập.');
}
function openCardDialog(cardId = null) {
  const card = currentCollection()?.cards.find((item) => item.id === cardId);
  editingCardId = card?.id || null;
  $('#cardDialogTitle').textContent = card ? 'Chỉnh sửa flashcard' : 'Thêm flashcard';
  $('#frontText').value = card?.front || ''; $('#backText').value = card?.back || '';
  $$('input[name="cardStyle"]').forEach((input) => { input.checked = input.value === (card?.style || 'paper'); });
  $('#saveCardBtn').textContent = card ? 'Lưu thay đổi' : 'Lưu flashcard';
  $('#cardDialog').showModal(); setTimeout(() => $('#frontText').focus(), 50);
}
function deleteCard(cardId) {
  const collection = currentCollection();
  const card = collection?.cards.find((item) => item.id === cardId);
  if (!collection || !card) return;
  if (!window.confirm(`Xoá flashcard “${card.front}”?`)) return;
  collection.cards = collection.cards.filter((item) => item.id !== cardId);
  cardIndex = Math.min(cardIndex, Math.max(0, collection.cards.length - 1));
  flipped = false;
  render();
  toast('Đã xoá flashcard.');
}
$('#newCollectionBtn').onclick = openNewCollection;
$('#addCardBtn').onclick = () => openCardDialog();
$('#editCollectionBtn').onclick = openEditCollection;
$('#deleteCollectionBtn').onclick = deleteCollection;
$$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => {
  document.getElementById(button.dataset.closeDialog)?.close();
}));
$$('.tab').forEach((tab) => tab.addEventListener('click', () => { view = tab.dataset.view; $$('.tab').forEach((item) => item.classList.toggle('active', item === tab)); renderContent(); }));
$('#collectionForm').addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') { event.preventDefault(); $('#collectionDialog').close(); return; }
  event.preventDefault(); const name = $('#collectionName').value.trim(); if (!name) return;
  if (editingCollection) { const collection = currentCollection(); if (collection) collection.name = name; }
  else { const collection = { id: uid(), name, cards: [] }; data.collections.push(collection); activeId = collection.id; cardIndex = 0; view = 'study'; }
  $('#collectionDialog').close(); render(); toast(editingCollection ? 'Đã cập nhật bộ sưu tập.' : 'Đã tạo bộ sưu tập.');
});
$('#cardForm').addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') { event.preventDefault(); $('#cardDialog').close(); return; }
  event.preventDefault(); const collection = currentCollection(); if (!collection) return;
  const card = { id: editingCardId || uid(), front: $('#frontText').value.trim(), back: $('#backText').value.trim(), style: $('input[name="cardStyle"]:checked').value };
  if (!card.front || !card.back) return;
  if (editingCardId) { const index = collection.cards.findIndex((item) => item.id === editingCardId); if (index >= 0) collection.cards[index] = card; }
  else { collection.cards.push(card); cardIndex = collection.cards.length - 1; view = 'study'; }
  flipped = false; $('#cardDialog').close(); render(); toast(editingCardId ? 'Đã cập nhật flashcard.' : 'Đã thêm flashcard.');
});
$('#backupBtn').onclick = () => {
  const choice = window.confirm('Chọn OK để xuất bản sao lưu. Chọn Cancel để nhập bản sao lưu từ tệp JSON.');
  if (choice) {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hanzi-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); toast('Đã tải bản sao lưu.');
  } else $('#importFile').click();
};
$('#importFile').addEventListener('change', async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.collections) || parsed.collections.some((collection) => typeof collection.name !== 'string' || !Array.isArray(collection.cards) || collection.cards.some((card) => typeof card.front !== 'string' || typeof card.back !== 'string'))) throw new Error('invalid');
    if (!window.confirm('Khôi phục sẽ thay thế toàn bộ dữ liệu hiện tại trên trình duyệt này. Tiếp tục?')) return;
    data = parsed; activeId = data.collections[0]?.id || null; cardIndex = 0; flipped = false; render(); toast('Đã khôi phục dữ liệu.');
  } catch { toast('Tệp sao lưu không hợp lệ.'); }
  finally { event.target.value = ''; }
});
render();
