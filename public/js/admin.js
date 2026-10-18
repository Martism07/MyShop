import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,signInWithEmailAndPassword,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,getDoc,collection,getDocs,updateDoc,deleteDoc,setDoc,addDoc} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {mergeCatalog,validProduct} from './catalog.js';
import {firebaseConfig} from './firebase-config.js';
const $=s=>document.querySelector(s);const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const money=n=>'₱'+Number(n||0).toLocaleString('en-PH');let auth,db,authorized=false,orders=[];
let authGeneration=0;
function withTimeout(promise) {
  let timer;
  return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Connection timed out. Check your internet and retry.')),15000)})]).finally(()=>clearTimeout(timer));
}
try {
 const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
 onAuthStateChanged(auth,async user=>{
  const generation=++authGeneration;
  authorized=false;$('#adminPanel').hidden=true;$('#loginPanel').hidden=false;$('#logout').hidden=!user;
  $('#loginStatus').textContent=user?'Verifying administrator access...':'';
  if(!user)return;
  try {
   const record=await withTimeout(getDoc(doc(db,'admins',user.uid)));
   if(generation!==authGeneration)return;
   if(!record.exists()) {$('#loginStatus').textContent='This account is not authorized as an admin. Sign out to use another account.';return;}
   authorized=true;$('#loginPanel').hidden=true;$('#adminPanel').hidden=false;
   await Promise.all([loadOrders(),loadProducts()]);
  } catch(error) {
   if(generation!==authGeneration)return;
   console.error(error);$('#loginPanel').hidden=false;
   $('#loginStatus').textContent='Unable to verify access. Check your connection, then sign in again. '+error.message;
  }
 },error=>{$('#loginPanel').hidden=false;$('#loginStatus').textContent='Sign-in unavailable: '+error.message;});
} catch(error) {$('#loginStatus').textContent='Firebase initialization failed. Please reload the page.';}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();if(!auth)return;let d=Object.fromEntries(new FormData(e.currentTarget));$('#loginStatus').textContent='Signing in…';try{await signInWithEmailAndPassword(auth,d.email,d.password);}catch(err){console.error(err);$('#loginStatus').textContent='Sign-in failed. Check your credentials.'}});
$('#logout').onclick=()=>auth&&signOut(auth);$('#refresh').onclick=()=>loadOrders();
async function loadOrders(){if(!authorized)return;$('#adminStatus').textContent='Loading orders…';try{const snap=await getDocs(collection(db,'orders'));orders=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));$('#orderCount').textContent=orders.length;$('#orderValue').textContent=money(orders.reduce((s,o)=>s+Number(o.total||0),0));$('#ordersList').innerHTML=orders.length?orders.map(o=>`<article class="order-card" data-id="${o.id}"><div class="order-top"><div><h3>${esc(o.firstName)} ${esc(o.lastName)}</h3><p>${esc(o.email)} · ${esc(o.contactNumber)}<br>${esc(o.address)}</p><p><strong>Items:</strong> ${esc((o.items||[]).map(i=>`${i.name} × ${i.quantity}`).join(', '))}</p><p><strong>Total:</strong> ${money(o.total)} · <strong>Status:</strong> ${esc(o.status)}</p></div><div class="order-actions"><button data-action="edit">Edit</button><button class="danger" data-action="delete">Delete</button></div></div><div class="edit-holder"></div></article>`).join(''):'<p>No orders have been submitted yet.</p>';$('#adminStatus').textContent=''}catch(e){console.error(e);$('#adminStatus').textContent='Unable to load orders. Check Firestore rules and access.'}}
$('#ordersList').addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b||!authorized)return;const card=b.closest('[data-id]');const id=card.dataset.id;const order=orders.find(o=>o.id===id);if(!order)return;if(b.dataset.action==='delete'){if(!confirm('Permanently delete this order?'))return;try{await deleteDoc(doc(db,'orders',id));await loadOrders()}catch(err){console.error(err);alert('Delete failed.')}}else if(b.dataset.action==='edit'){const holder=card.querySelector('.edit-holder');holder.innerHTML=`<form class="edit-form"><div class="edit-fields">${['firstName','lastName','address','contactNumber','email'].map(k=>`<label>${k}<input name="${k}" value="${esc(order[k])}" maxlength="300" required></label>`).join('')}<label>Status<select name="status"><option>New</option><option>Processing</option><option>Completed</option><option>Cancelled</option></select></label></div><button class="btn btn-primary" type="submit">Save changes</button></form>`;holder.querySelector('select').value=order.status||'New';holder.querySelector('form').onsubmit=async ev=>{ev.preventDefault();const data=Object.fromEntries(new FormData(ev.currentTarget));try{await updateDoc(doc(db,'orders',id),data);await loadOrders()}catch(err){console.error(err);alert('Update failed.')}}}});

let catalog=[];
async function loadProducts(){
 if(!authorized)return;
 $('#catalogStatus').textContent='Loading products...';
 try {
  const snap=await withTimeout(getDocs(collection(db,'products')));
  if(!authorized)return;
  catalog=mergeCatalog(snap.docs.map(d=>({...d.data(),id:d.id})));
  $('#adminProducts').innerHTML=catalog.map(p=>`<article class="admin-product"><img src="${esc(p.image)}" alt="" loading="lazy"><div><h3>${esc(p.name)}</h3><p>${esc(p.category)} · ${money(p.price)}</p></div><button class="btn btn-outline" data-product="${esc(p.id)}">Edit</button></article>`).join('');
  $('#catalogStatus').textContent=catalog.length+' products';
 } catch(error){console.error(error);$('#catalogStatus').textContent='Could not load products. Check your connection and refresh.';}
}
function resetProductForm(){ $('#productForm').reset();$('#productForm').elements.id.value='';$('#productFormTitle').textContent='Add product';$('#saveProduct').textContent='Add product'; }
$('#refreshProducts').onclick=loadProducts;
$('#cancelProduct').onclick=()=>{resetProductForm();$('#productSaveStatus').textContent='';};
$('#adminProducts').onclick=e=>{
 const button=e.target.closest('[data-product]');if(!button)return;
 const p=catalog.find(p=>p.id===button.dataset.product);if(!p)return;
 for(const key of ['id','name','category','price','image'])$('#productForm').elements[key].value=p[key];
 $('#productFormTitle').textContent='Edit product';$('#saveProduct').textContent='Save changes';$('#productSaveStatus').textContent='';
 $('#productForm').scrollIntoView({behavior:'smooth',block:'center'});$('#productForm').elements.price.focus();
};
$('#productForm').onsubmit=async e=>{
 e.preventDefault();if(!authorized)return;
 const fields=Object.fromEntries(new FormData(e.currentTarget));
 const p={name:fields.name.trim(),category:fields.category,price:Number(fields.price),image:fields.image.trim()};
 if(!validProduct(p)){$('#productSaveStatus').textContent='Enter a valid name, positive price, category and HTTPS image URL.';return;}
 const id=fields.id;
 $('#saveProduct').disabled=true;$('#cancelProduct').disabled=true;$('#productSaveStatus').textContent='Saving...';
 try {
  if(id)await setDoc(doc(db,'products',id),p);else await addDoc(collection(db,'products'),p);
  resetProductForm();$('#productSaveStatus').textContent='Product saved. The shop updates automatically.';await loadProducts();
 } catch(error){console.error(error);$('#productSaveStatus').textContent='Save failed. Check your connection and administrator access.';}
 finally{$('#saveProduct').disabled=false;$('#cancelProduct').disabled=false;}
};
