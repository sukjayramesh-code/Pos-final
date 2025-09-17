/* Glass POS — script.js
   Shared by index.html and report.html
*/

const STORAGE_ORDERS_KEY = 'twistello_orders_glass_v1';
const STORAGE_COSTS_KEY  = 'twistello_costs_glass_v1';
const STORAGE_REVIEWS_KEY = 'twistello_reviews_glass_v1';

// MENU & ADDONS (same IDs used across pages)
const MENU = [
  { id: 'spag_bol', name: 'Spaghetti Bolognese', price: 7.50, img: 'spaghetti.png' },
  { id: 'spag_car', name: 'Spaghetti Carbonara', price: 7.50, img: 'spaghetti.png' },
  { id: 'mac_car', name: 'Macaroni Carbonara', price: 8.50, img: 'macaroni.png' },
  { id: 'mac_bol', name: 'Macaroni Bolognese', price: 8.50, img: 'macaroni.png' },
  { id: 'marsh', name: 'Marshmallow (Dessert)', price: 5.00, img: 'marshmallow.png' },
  { id: 'sarbath', name: 'Sarbath (Drink)', price: 3.50, img: 'sarbath.png' }
];
const ADDONS = [
  { id: 'ham', name: 'Chicken Ham', price: 2.00 },
  { id: 'sausage', name: 'Sausage', price: 2.50 }
];

const DEFAULT_COSTS = {
  spag_bol:4.00, spag_car:4.00, mac_car:5.00, mac_bol:5.00, marsh:1.50, sarbath:1.00, ham:1.00, sausage:1.20
};

function formatRM(n){ return 'RM' + Number(n || 0).toFixed(2); }
function loadOrders(){ try{ return JSON.parse(localStorage.getItem(STORAGE_ORDERS_KEY)) || []; }catch(e){return []} }
function saveOrders(arr){ localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(arr)); }
function loadCosts(){ try{ return JSON.parse(localStorage.getItem(STORAGE_COSTS_KEY)) || DEFAULT_COSTS; }catch(e){return DEFAULT_COSTS} }
function saveCosts(obj){ localStorage.setItem(STORAGE_COSTS_KEY, JSON.stringify(obj)); }
function loadReviews(){ try{ return JSON.parse(localStorage.getItem(STORAGE_REVIEWS_KEY)) || []; }catch(e){return []} }
function saveReviews(arr){ localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(arr)); }

document.addEventListener('DOMContentLoaded', ()=>{
  const page = document.body.dataset.page || 'index';
  if(page === 'index') initIndex();
  if(page === 'report') initReport();
});

/* ----------- INDEX PAGE ----------- */
function initIndex(){
  const menuGrid = document.getElementById('menuGrid');
  const addonsGrid = document.getElementById('addonsGrid');
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const btnSaveOrder = document.getElementById('btnSaveOrder');
  const btnClearCart = document.getElementById('btnClearCart');
  const orderHistoryEl = document.getElementById('orderHistory');
  const customerNameInput = document.getElementById('customerName');
  const paymentModal = document.getElementById('paymentModal');
  const closeModal = document.getElementById('closeModal');

  let cart = [];

  // render menu cards (images + add button)
  MENU.forEach(item=>{
    const card = document.createElement('div'); card.className = 'menu-card';
    card.innerHTML = `
      <img src="${item.img}" alt="${item.name}" />
      <div class="meta">
        <h4>${item.name}</h4>
        <div class="muted">${formatRM(item.price)}</div>
      </div>
      <div>
        <button class="add-btn" data-id="${item.id}">+ Add</button>
      </div>`;
    menuGrid.appendChild(card);
  });

  // addons
  ADDONS.forEach(item=>{
    const card = document.createElement('div'); card.className = 'menu-card';
    card.innerHTML = `<div class="meta"><h4>${item.name}</h4><div class="muted">+ ${formatRM(item.price)}</div></div>
                      <div><button class="add-btn" data-id="${item.id}">+ Add</button></div>`;
    addonsGrid.appendChild(card);
  });

  // delegate add clicks
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.add-btn'); if(!btn) return;
    addToCart(btn.dataset.id);
  });

  function addToCart(id){
    const found = cart.find(c=>c.id===id);
    if(found) found.qty += 1;
    else cart.push({ id, qty:1 });
    renderCart();
  }

  function renderCart(){
    cartItemsEl.innerHTML = '';
    if(cart.length === 0){ cartItemsEl.innerHTML = '<p class="muted">No items in cart</p>'; cartTotalEl.textContent = formatRM(0); return; }
    const wrapper = document.createElement('div'); wrapper.style.display='flex'; wrapper.style.flexDirection='column'; wrapper.style.gap='8px';
    cart.forEach(entry=>{
      const item = MENU.find(m=>m.id===entry.id) || ADDONS.find(a=>a.id===entry.id);
      const row = document.createElement('div'); row.className = 'cart-row';
      row.innerHTML = `<div><div style="font-weight:700">${item.name}</div><div class="muted">${formatRM(item.price)} each</div></div>
                       <div style="display:flex;align-items:center;gap:10px">
                         <div class="qty-controls">
                           <button class="minus" data-id="${entry.id}">−</button>
                           <span style="min-width:28px;text-align:center">${entry.qty}</span>
                           <button class="plus" data-id="${entry.id}">+</button>
                         </div>
                         <button class="remove-btn" data-id="${entry.id}">✕</button>
                         <div style="font-weight:700;margin-left:8px">${formatRM(item.price * entry.qty)}</div>
                       </div>`;
      wrapper.appendChild(row);
    });
    cartItemsEl.appendChild(wrapper);

    // attach handlers
    cartItemsEl.querySelectorAll('.plus').forEach(b=> b.addEventListener('click', ()=> changeQty(b.dataset.id, 1)));
    cartItemsEl.querySelectorAll('.minus').forEach(b=> b.addEventListener('click', ()=> changeQty(b.dataset.id, -1)));
    cartItemsEl.querySelectorAll('.remove-btn').forEach(b=> b.addEventListener('click', ()=> removeItem(b.dataset.id)));

    cartTotalEl.textContent = formatRM(getCartTotal());
  }

  function changeQty(id, delta){
    const e = cart.find(c=>c.id===id); if(!e) return; e.qty += delta; if(e.qty<=0) cart = cart.filter(c=>c.id!==id); renderCart();
  }
  function removeItem(id){ cart = cart.filter(c=>c.id!==id); renderCart(); }
  function getCartTotal(){ return cart.reduce((acc,c)=>{ const price = ((MENU.find(m=>m.id===c.id) || ADDONS.find(a=>a.id===c.id))||{}).price || 0; return acc + price*c.qty; }, 0); }

  btnClearCart.addEventListener('click', ()=>{ if(!cart.length) return; if(confirm('Clear cart?')){ cart=[]; renderCart(); } });

  btnSaveOrder.addEventListener('click', ()=>{
    const name = customerNameInput.value.trim(); if(!name){ alert('Please enter customer name'); customerNameInput.focus(); return; }
    if(cart.length === 0){ alert('Cart is empty'); return; }
    const items = cart.map(it=>{ const m = MENU.find(x=>x.id===it.id) || ADDONS.find(x=>x.id===it.id); return { id: it.id, name: m.name, unitPrice: m.price, qty: it.qty, subtotal: m.price * it.qty }; });
    const total = items.reduce((s,i)=>s+i.subtotal,0);
    const orders = loadOrders();
    const order = { id:'ord_'+Date.now(), customer: name, items, total, paid:false, createdAt: new Date().toISOString() };
    orders.push(order); saveOrders(orders);
    cart = []; customerNameInput.value=''; renderCart(); renderOrderHistory(); alert('Order saved ✅');
  });

  // render order history
  function renderOrderHistory(){
    const orders = loadOrders(); orderHistoryEl.innerHTML = '';
    if(!orders.length){ orderHistoryEl.innerHTML = '<p class="muted">No orders yet</p>'; return; }
    orders.slice().reverse().forEach(o=>{
      const div = document.createElement('div'); div.className='history-item';
      const left = document.createElement('div');
      left.innerHTML = `<div style="font-weight:700">${o.customer} ${o.paid?'<span style="color:#6ff09a;margin-left:8px">PAID</span>':'<span style="color:#ffce7a;margin-left:8px">UNPAID</span>'}</div>
                        <div class="muted">${new Date(o.createdAt).toLocaleString()}</div>
                        <div class="muted" style="font-size:0.9rem">${o.items.map(i=>`${i.name} x${i.qty}`).join(' · ')}</div>`;
      const right = document.createElement('div');
      right.innerHTML = `<div style="text-align:right">${formatRM(o.total)}</div>
                         <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
                           <button class="btn-secondary view-order" data-id="${o.id}">View</button>
                           <button class="btn pay-order" data-id="${o.id}">${o.paid?'Mark Unpaid':'Mark Paid'}</button>
                           <button class="btn" data-id="${o.id}">Delete</button>
                         </div>`;
      div.appendChild(left); div.appendChild(right); orderHistoryEl.appendChild(div);
    });

    // listeners
    orderHistoryEl.querySelectorAll('.view-order').forEach(b=> b.addEventListener('click', ()=>{
      const id = b.dataset.id; const o = loadOrders().find(x=>x.id===id); if(!o) return alert('Order not found');
      const details = o.items.map(i=>`${i.name} x${i.qty} = ${formatRM(i.subtotal)}`).join('\n');
      alert(`Customer: ${o.customer}\nTime: ${new Date(o.createdAt).toLocaleString()}\n\n${details}\n\nTotal: ${formatRM(o.total)}\nPaid: ${o.paid ? 'Yes' : 'No'}`);
    }));

    orderHistoryEl.querySelectorAll('.pay-order').forEach(b=> b.addEventListener('click', ()=>{
      const id = b.dataset.id; let orders = loadOrders(); const idx = orders.findIndex(x=>x.id===id); if(idx<0) return;
      if(!orders[idx].paid){
        // open payment modal to show QR
        const paymentModal = document.getElementById('paymentModal'); if(paymentModal) paymentModal.classList.remove('hidden');
        if(!confirm('After customer pays, click OK to mark Paid. (Cancel to keep unpaid)')){ if(paymentModal) paymentModal.classList.add('hidden'); return; }
      }
      orders[idx].paid = !orders[idx].paid; saveOrders(orders); renderOrderHistory();
      const pm = document.getElementById('paymentModal'); if(pm) pm.classList.add('hidden');
    }));

    orderHistoryEl.querySelectorAll('.btn[data-id]').forEach(b=>{
      if(b.classList.contains('view-order') || b.classList.contains('pay-order')) return;
      b.addEventListener('click', ()=>{
        const id = b.dataset.id; if(!confirm('Delete this order?')) return;
        let orders = loadOrders(); orders = orders.filter(x=>x.id !== id); saveOrders(orders); renderOrderHistory();
      });
    });
  }

  // modal close
  const closeModalBtn = document.getElementById('closeModal');
  if(closeModalBtn) closeModalBtn.addEventListener('click', ()=> { const m=document.getElementById('paymentModal'); if(m) m.classList.add('hidden'); });

  // init
  renderCart(); renderOrderHistory();
}

/* ----------- REPORT PAGE ----------- */
function initReport(){
  const itemsTableBody = document.querySelector('#itemsTable tbody');
  const totalRevenueEl = document.getElementById('totalRevenue');
  const totalCostEl = document.getElementById('totalCost');
  const totalProfitEl = document.getElementById('totalProfit');
  const bestSellerEl = document.getElementById('bestSeller');
  const fullOrderList = document.getElementById('fullOrderList');
  const btnSaveCosts = document.getElementById('btnSaveCosts');
  const btnClearAll = document.getElementById('btnClearAll');
  const btnExportCSV = document.getElementById('btnExportCSV');
  const reviewQRContainer = document.getElementById('reviewQR');

  let costs = loadCosts();

  function render(){
    const orders = loadOrders();

    // stats includes addons
    const stats = {};
    [...MENU, ...ADDONS].forEach(m=> stats[m.id] = { id:m.id, name:m.name, price:m.price, qty:0, revenue:0, costPerUnit: (costs[m.id]||0) });

    orders.forEach(o=>{
      o.items.forEach(it=>{
        if(!stats[it.id]) return;
        stats[it.id].qty += it.qty;
        stats[it.id].revenue += it.subtotal;
      });
    });

    // table rows
    itemsTableBody.innerHTML = '';
    let totalRevenue = 0, totalCost = 0, totalProfit = 0;
    Object.values(stats).forEach(s=>{
      const totalCostItem = s.qty * (s.costPerUnit || 0);
      const profit = s.revenue - totalCostItem;
      totalRevenue += s.revenue; totalCost += totalCostItem; totalProfit += profit;

      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${s.name}</td><td>${s.qty}</td><td>${formatRM(s.revenue)}</td>
                      <td><input data-id="${s.id}" class="cost-input" type="number" min="0" step="0.01" value="${(s.costPerUnit||0).toFixed(2)}" /></td>
                      <td>${formatRM(totalCostItem)}</td><td>${formatRM(profit)}</td>`;
      itemsTableBody.appendChild(tr);
    });

    totalRevenueEl.textContent = formatRM(totalRevenue);
    totalCostEl.textContent = formatRM(totalCost);
    totalProfitEl.textContent = formatRM(totalProfit);

    const best = Object.values(stats).sort((a,b)=>b.qty - a.qty)[0];
    bestSellerEl.textContent = (best && best.qty>0) ? `${best.name} (${best.qty})` : '—';

    // orders list
    fullOrderList.innerHTML = '';
    if(!orders.length){ fullOrderList.innerHTML = '<p class="muted">No orders yet</p>'; }
    else {
      orders.slice().reverse().forEach(o=>{
        const div = document.createElement('div'); div.className='history-item';
        div.innerHTML = `<div><div style="font-weight:700">${o.customer}</div>
                         <div class="muted">${new Date(o.createdAt).toLocaleString()}</div>
                         <div class="muted" style="font-size:0.9rem">${o.items.map(i=>`${i.name} x${i.qty}`).join(' · ')}</div></div>
                         <div style="text-align:right">${formatRM(o.total)}<div class="muted" style="font-size:0.85rem">${o.paid? 'Paid':'Unpaid'}</div></div>`;
        fullOrderList.appendChild(div);
      });
    }

    // cost inputs -> update local costs var
    document.querySelectorAll('.cost-input').forEach(inp=>{
      inp.addEventListener('change', ()=> {
        const id = inp.dataset.id; const v = Number(inp.value) || 0; costs[id] = v;
      });
    });

    // charts
    drawCharts(stats, orders);
  }

  // CHARTS
  let pieChart = null, statusChart = null;
  function drawCharts(stats, orders){
    const labels = [], data = [];
    Object.values(stats).forEach(s=>{ if(s.qty>0){ labels.push(s.name); data.push(Number(s.revenue.toFixed(2))); }});
    if(labels.length===0){ labels.push('No sales'); data.push(1); }

    const pieCtx = document.getElementById('pieChart').getContext('2d');
    if(pieChart) pieChart.destroy();
    pieChart = new Chart(pieCtx, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: generateColors(data.length) }] },
      options: { responsive:true, plugins:{ legend:{ position:'bottom' } } }
    });

    const paid = orders.filter(o=>o.paid).length;
    const unpaid = orders.length - paid;
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    if(statusChart) statusChart.destroy();
    statusChart = new Chart(statusCtx, {
      type:'doughnut',
      data:{ labels:['Paid','Unpaid'], datasets:[{ data:[paid, unpaid], backgroundColor:['#7ee787','#f59e0b'] }]},
      options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
    });
  }

  function generateColors(n){
    const palette = ['#8fc3ff','#6fb7ff','#4ea8ff','#2d8aff','#a3d9ff','#ffd9b3','#ffd3d3','#c3f0c3'];
    const out=[]; for(let i=0;i<n;i++) out.push(palette[i % palette.length]); return out;
  }

  btnSaveCosts.addEventListener('click', ()=>{
    document.querySelectorAll('.cost-input').forEach(inp=> { const id = inp.dataset.id; costs[id] = Number(inp.value) || 0; });
    saveCosts(costs); render(); alert('Costs saved ✅');
  });

  btnClearAll.addEventListener('click', ()=>{ if(!confirm('Delete all orders?')) return; saveOrders([]); render(); });

  btnExportCSV.addEventListener('click', ()=>{
    const orders = loadOrders(); if(!orders.length){ alert('No orders to export'); return; }
    // simple CSV export
    const rows = [['OrderID','Customer','Items','Total','Paid','Time']];
    orders.forEach(o=> rows.push([o.id, o.customer, o.items.map(i=>`${i.name} x${i.qty}`).join('; '), o.total.toFixed(2), o.paid ? 'Yes':'No', o.createdAt]));
    const csv = rows.map(r=> r.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download = 'twistello_orders.csv'; a.click(); URL.revokeObjectURL(url);
  });

  // generate review QR (points to local review.html relative path)
  if(reviewQRContainer){
    reviewQRContainer.innerHTML = '';
    // try absolute-ish path; file:// may not work on some devices but QR will contain path
    const base = (location.origin && location.origin !== 'null') ? location.origin + location.pathname.replace(/\/(index\.html|report\.html)?$/, '/') : '';
    const target = (base || '') + 'review.html';
    new QRCode(reviewQRContainer, { text: target, width:128, height:128 });
  }

  render();
}

/* ---------- REVIEW HANDLING (optional local review page) ---------- */
// If the user opens review.html this will still work because script runs there too
if(document.body.dataset.page === 'review'){
  document.addEventListener('DOMContentLoaded', ()=>{
    // minimal review page handling is in the same script in the original prototype — keep storage keys above
    initReviewPage();
  });
}

function initReviewPage(){
  const btnSend = document.getElementById('btnSendReview');
  const btnClearReviews = document.getElementById('btnClearReviews');
  const rvRating = document.getElementById('rvRating');
  const rvComment = document.getElementById('rvComment');
  const reviewList = document.getElementById('reviewList');
  if(!btnSend) return;

  function renderReviews(){
    const items = loadReviews(); reviewList.innerHTML = '';
    if(!items.length) { reviewList.innerHTML = '<p class="muted">No reviews yet</p>'; return; }
    items.slice().reverse().forEach(r=>{
      const div = document.createElement('div'); div.className='history-item';
      div.innerHTML = `<div><div style="font-weight:700">Rating: ${r.rating}/5</div><div class="muted">${r.time}</div><div class="muted" style="margin-top:6px">${r.comment || ''}</div></div>`;
      reviewList.appendChild(div);
    });
  }

  btnSend.addEventListener('click', ()=>{
    const rating = Number(rvRating.value) || 5;
    const comment = (rvComment && rvComment.value) ? rvComment.value.trim() : '';
    const arr = loadReviews(); arr.push({ rating, comment, time:new Date().toLocaleString() }); saveReviews(arr);
    if(rvComment) rvComment.value = ''; alert('Thanks for your review (anonymous)'); renderReviews();
  });

  btnClearReviews.addEventListener('click', ()=> { if(!confirm('Clear all reviews?')) return; saveReviews([]); renderReviews(); });

  renderReviews();
}