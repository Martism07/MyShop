import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {mergeCatalog,validProduct} from '../public/js/catalog.js';

test('saved prices replace defaults and new products join the catalog',()=>{
 const base=mergeCatalog([]);
 const changed={...base[0],price:275.50};
 const added={id:'new',name:'New fragrance',price:325,category:'Women',image:'https://example.com/item.jpg'};
 const result=mergeCatalog([changed,added]);
 assert.equal(result.length,base.length+1);
 assert.equal(result.find(p=>p.id===changed.id).price,275.50);
 assert.deepEqual(result.find(p=>p.id==='new'),added);
 assert.equal(mergeCatalog([])[0].price,150);
});
test('invalid prices and unsafe image URLs cannot enter the catalog',()=>{
 const p=mergeCatalog([])[0];
 for(const price of [-1,0,NaN,Infinity,1000001])assert.equal(validProduct({...p,price}),false);
 assert.equal(validProduct({...p,image:'javascript:alert(1)'}),false);
 assert.equal(validProduct({...p,image:'https://x.com/" onerror="alert(1)'}),false);
 assert.equal(mergeCatalog([{...p,price:-1}])[0].price,150);
});
function adminHarness(getDoc){
 const elements=new Map();let listener;
 const element=id=>{if(!elements.has(id))elements.set(id,{hidden:false,textContent:'',addEventListener(){}});return elements.get(id)};
 const context={console,document:{querySelector:element},initializeApp:()=>({}),getAuth:()=>({}),getFirestore:()=>({}),onAuthStateChanged:(_,fn)=>listener=fn,
  firebaseConfig:{},getDoc,doc:()=>({}),collection:()=>({}),getDocs:async()=>({docs:[]}),mergeCatalog,validProduct,setTimeout,clearTimeout};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync('public/js/admin.js','utf8').replace(/^import .*;\r?\n/gm,''),context);
 return {element,signIn:()=>listener({uid:'test'})};
}
test('login remains visible while administrator verification is pending',async()=>{
 let resolve;
 const h=adminHarness(()=>new Promise(r=>resolve=r));
 const pending=h.signIn();
 assert.equal(h.element('#loginPanel').hidden,false);
 assert.match(h.element('#loginStatus').textContent,/Verifying/);
 resolve({exists:()=>true});await pending;
 assert.equal(h.element('#adminPanel').hidden,false);
 assert.equal(h.element('#loginPanel').hidden,true);
});
test('missing admin record shows an error instead of a blank page',async()=>{
 const h=adminHarness(async()=>({exists:()=>false}));await h.signIn();
 assert.equal(h.element('#loginPanel').hidden,false);
 assert.equal(h.element('#adminPanel').hidden,true);
 assert.match(h.element('#loginStatus').textContent,/not authorized/);
});
