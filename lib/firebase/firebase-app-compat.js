!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e="undefined"!=typeof globalThis?globalThis:e||self).firebase=t()}(this,function(){"use strict";const r=function(t){const r=[];let n=0;for(let i=0;i<t.length;i++){let e=t.charCodeAt(i);e<128?r[n++]=e:(e<2048?r[n++]=e>>6|192:(55296==(64512&e)&&i+1<t.length&&56320==(64512&t.charCodeAt(i+1))?(e=65536+((1023&e)<<10)+(1023&t.charCodeAt(++i)),r[n++]=e>>18|240,r[n++]=e>>12&63|128):r[n++]=e>>12|224,r[n++]=e>>6&63|128),r[n++]=63&e|128)}return r},n={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:"function"==typeof atob,encodeByteArray(r,e){if(!Array.isArray(r))throw Error("encodeByteArray takes an array as a parameter");this.init_();var n=e?this.byteToCharMapWebSafe_:this.byteToCharMap_;const i=[];for(let l=0;l<r.length;l+=3){var a=r[l],s=l+1<r.length,o=s?r[l+1]:0,c=l+2<r.length,h=c?r[l+2]:0;let e=(15&o)<<2|h>>6,t=63&h;c||(t=64,s||(e=64)),i.push(n[a>>2],n[(3&a)<<4|o>>4],n[e],n[t])}return i.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(r(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):function(e){const t=[];let r=0,n=0;for(;r<e.length;){var i,a,s=e[r++];s<128?t[n++]=String.fromCharCode(s):191<s&&s<224?(i=e[r++],t[n++]=String.fromCharCode((31&s)<<6|63&i)):239<s&&s<365?(a=((7&s)<<18|(63&e[r++])<<12|(63&e[r++])<<6|63&e[r++])-65536,t[n++]=String.fromCharCode(55296+(a>>10)),t[n++]=String.fromCharCode(56320+(1023&a))):(i=e[r++],a=e[r++],t[n++]=String.fromCharCode((15&s)<<12|(63&i)<<6|63&a))}return t.join("")}(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();var r=t?this.charToByteMapWebSafe_:this.charToByteMap_;const n=[];for(let c=0;c<e.length;){var i=r[e.charAt(c++)],a=c<e.length?r[e.charAt(c)]:0;++c;var s=c<e.length?r[e.charAt(c)]:64;++c;var o=c<e.length?r[e.charAt(c)]:64;if(++c,null==i||null==a||null==s||null==o)throw new h;n.push(i<<2|a>>4),64!==s&&(n.push(a<<4&240|s>>2),64!==o&&n.push(s<<6&192|o))}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class h extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const i=function(e){return e=e,t=r(e),n.encodeByteArray(t,!0).replace(/\./g,"");var t};function c(e,t){if(!(t instanceof Object))return t;switch(t.constructor){case Date:const r=t;return new Date(r.getTime());case Object:void 0===e&&(e={});break;case Array:e=[];break;default:return t}for(const n in t)t.hasOwnProperty(n)&&"__proto__"!==n&&(e[n]=c(e[n],t[n]));return e}const e=()=>function(){if("undefined"!=typeof self)return self;if("undefined"!=typeof window)return window;if("undefined"!=typeof global)return global;throw new Error("Unable to locate global object.")}().__FIREBASE_DEFAULTS__,t=()=>{if("undefined"!=typeof document){let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch(e){return}var t=e&&function(e){try{return n.decodeString(e,!0)}catch(e){console.error("base64Decode failed: ",e)}return null}(e[1]);return t&&JSON.parse(t)}},a=()=>{try{return e()||(()=>{if("undefined"!=typeof process&&void 0!==process.env){var e=process.env.__FIREBASE_DEFAULTS__;return e?JSON.parse(e):void 0}})()||t()}catch(e){return void console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`)}},l=()=>{var e;return null===(e=a())||void 0===e?void 0:e.config};class s{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(r){return(e,t)=>{e?this.reject(e):this.resolve(t),"function"==typeof r&&(this.promise.catch(()=>{}),1===r.length?r(e):r(e,t))}}}class o extends Error{constructor(e,t,r){super(t),this.code=e,this.customData=r,this.name="FirebaseError",Object.setPrototypeOf(this,o.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,d.prototype.create)}}class d{constructor(e,t,r){this.service=e,this.serviceName=t,this.errors=r}create(e,...t){var n,r=t[0]||{},i=`${this.service}/${e}`,a=this.errors[e],a=a?(n=r,a.replace(p,(e,t)=>{var r=n[t];return null!=r?String(r):`<${t}?>`})):"Error",a=`${this.serviceName}: ${a} (${i}).`;return new o(i,a,r)}}const p=/\{\$([^}]+)}/g;function u(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function f(e,t){if(e===t)return 1;const r=Object.keys(e),n=Object.keys(t);for(const s of r){if(!n.includes(s))return;var i=e[s],a=t[s];if(g(i)&&g(a)){if(!f(i,a))return}else if(i!==a)return}for(const o of n)if(!r.includes(o))return;return 1}function g(e){return null!==e&&"object"==typeof e}function m(e,t){const r=new b(e,t);return r.subscribe.bind(r)}class b{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(e=>{this.error(e)})}next(t){this.forEachObserver(e=>{e.next(t)})}error(t){this.forEachObserver(e=>{e.error(t)}),this.close(t)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,r){let n;if(void 0===e&&void 0===t&&void 0===r)throw new Error("Missing Observer.");n=function(e,t){if("object"!=typeof e||null===e)return!1;for(const r of t)if(r in e&&"function"==typeof e[r])return!0;return!1}(e,["next","error","complete"])?e:{next:e,error:t,complete:r},void 0===n.next&&(n.next=v),void 0===n.error&&(n.error=v),void 0===n.complete&&(n.complete=v);var i=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?n.error(this.finalError):n.complete()}catch(e){}}),this.observers.push(n),i}unsubscribeOne(e){void 0!==this.observers&&void 0!==this.observers[e]&&(delete this.observers[e],--this.observerCount,0===this.observerCount&&void 0!==this.onNoObservers&&this.onNoObservers(this))}forEachObserver(t){if(!this.finalized)for(let e=0;e<this.observers.length;e++)this.sendOne(e,t)}sendOne(e,t){this.task.then(()=>{if(void 0!==this.observers&&void 0!==this.observers[e])try{t(this.observers[e])}catch(e){"undefined"!=typeof console&&console.error&&console.error(e)}})}close(e){this.finalized||(this.finalized=!0,void 0!==e&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function v(){}class _{constructor(e,t,r){this.name=e,this.instanceFactory=t,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}const E="[DEFAULT]";class y{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){var t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const n=new s;if(this.instancesDeferred.set(t,n),this.isInitialized(t)||this.shouldAutoInitialize())try{var r=this.getOrInitializeService({instanceIdentifier:t});r&&n.resolve(r)}catch(e){}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t=this.normalizeInstanceIdentifier(null==e?void 0:e.identifier),r=null!==(r=null==e?void 0:e.optional)&&void 0!==r&&r;if(!this.isInitialized(t)&&!this.shouldAutoInitialize()){if(r)return null;throw Error(`Service ${this.name} is not available`)}try{return this.getOrInitializeService({instanceIdentifier:t})}catch(e){if(r)return null;throw e}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,this.shouldAutoInitialize()){if("EAGER"===e.instantiationMode)try{this.getOrInitializeService({instanceIdentifier:E})}catch(e){}for(var[t,r]of this.instancesDeferred.entries()){t=this.normalizeInstanceIdentifier(t);try{var n=this.getOrInitializeService({instanceIdentifier:t});r.resolve(n)}catch(e){}}}}clearInstance(e=E){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(e=>"INTERNAL"in e).map(e=>e.INTERNAL.delete()),...e.filter(e=>"_delete"in e).map(e=>e._delete())])}isComponentSet(){return null!=this.component}isInitialized(e=E){return this.instances.has(e)}getOptions(e=E){return this.instancesOptions.get(e)||{}}initialize(e={}){var{options:t={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);var n,i,a=this.getOrInitializeService({instanceIdentifier:r,options:t});for([n,i]of this.instancesDeferred.entries())r===this.normalizeInstanceIdentifier(n)&&i.resolve(a);return a}onInit(e,t){var r=this.normalizeInstanceIdentifier(t);const n=null!==(i=this.onInitCallbacks.get(r))&&void 0!==i?i:new Set;n.add(e),this.onInitCallbacks.set(r,n);var i=this.instances.get(r);return i&&e(i,r),()=>{n.delete(e)}}invokeOnInitCallbacks(e,t){var r=this.onInitCallbacks.get(t);if(r)for(const n of r)try{n(e,t)}catch(e){}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:(n=e)===E?void 0:n,options:t}),this.instances.set(e,r),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch(e){}var n;return r||null}normalizeInstanceIdentifier(e=E){return!this.component||this.component.multipleInstances?e:E}shouldAutoInitialize(){return!!this.component&&"EXPLICIT"!==this.component.instantiationMode}}class I{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){const t=this.getProvider(e.name);t.isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);var t=new y(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}const w=[];var C,D,S;(D=C=C||{})[D.DEBUG=0]="DEBUG",D[D.VERBOSE=1]="VERBOSE",D[D.INFO=2]="INFO",D[D.WARN=3]="WARN",D[D.ERROR=4]="ERROR",D[D.SILENT=5]="SILENT";const A={debug:C.DEBUG,verbose:C.VERBOSE,info:C.INFO,warn:C.WARN,error:C.ERROR,silent:C.SILENT},O=C.INFO,L={[C.DEBUG]:"log",[C.VERBOSE]:"log",[C.INFO]:"info",[C.WARN]:"warn",[C.ERROR]:"error"},N=(e,t,...r)=>{if(!(t<e.logLevel)){var n=(new Date).toISOString(),i=L[t];if(!i)throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`);console[i](`[${n}]  ${e.name}:`,...r)}};class B{constructor(e){this.name=e,this._logLevel=O,this._logHandler=N,this._userLogHandler=null,w.push(this)}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in C))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel="string"==typeof e?A[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if("function"!=typeof e)throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,C.DEBUG,...e),this._logHandler(this,C.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,C.VERBOSE,...e),this._logHandler(this,C.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,C.INFO,...e),this._logHandler(this,C.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,C.WARN,...e),this._logHandler(this,C.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,C.ERROR,...e),this._logHandler(this,C.ERROR,...e)}}const T=(t,e)=>e.some(e=>t instanceof e);let P,M;const R=new WeakMap,k=new WeakMap,F=new WeakMap,$=new WeakMap,j=new WeakMap;let H={get(e,t,r){if(e instanceof IDBTransaction){if("done"===t)return k.get(e);if("objectStoreNames"===t)return e.objectStoreNames||F.get(e);if("store"===t)return r.objectStoreNames[1]?void 0:r.objectStore(r.objectStoreNames[0])}return z(e[t])},set(e,t,r){return e[t]=r,!0},has(e,t){return e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e}};function V(n){return n!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(M=M||[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey]).includes(n)?function(...e){return n.apply(U(this),e),z(R.get(this))}:function(...e){return z(n.apply(U(this),e))}:function(e,...t){var r=n.call(U(this),e,...t);return F.set(r,e.sort?e.sort():[e]),z(r)}}function x(e){return"function"==typeof e?V(e):(e instanceof IDBTransaction&&(a=e,k.has(a)||(t=new Promise((e,t)=>{const r=()=>{a.removeEventListener("complete",n),a.removeEventListener("error",i),a.removeEventListener("abort",i)},n=()=>{e(),r()},i=()=>{t(a.error||new DOMException("AbortError","AbortError")),r()};a.addEventListener("complete",n),a.addEventListener("error",i),a.addEventListener("abort",i)}),k.set(a,t))),T(e,P=P||[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])?new Proxy(e,H):e);var a,t}function z(e){if(e instanceof IDBRequest)return function(a){const e=new Promise((e,t)=>{const r=()=>{a.removeEventListener("success",n),a.removeEventListener("error",i)},n=()=>{e(z(a.result)),r()},i=()=>{t(a.error),r()};a.addEventListener("success",n),a.addEventListener("error",i)});return e.then(e=>{e instanceof IDBCursor&&R.set(e,a)}).catch(()=>{}),j.set(e,a),e}(e);if($.has(e))return $.get(e);var t=x(e);return t!==e&&($.set(e,t),j.set(t,e)),t}const U=e=>j.get(e);const W=["get","getKey","getAll","getAllKeys","count"],G=["put","add","delete","clear"],J=new Map;function K(e,t){if(e instanceof IDBDatabase&&!(t in e)&&"string"==typeof t){if(J.get(t))return J.get(t);const i=t.replace(/FromIndex$/,""),a=t!==i,s=G.includes(i);if(i in(a?IDBIndex:IDBObjectStore).prototype&&(s||W.includes(i))){var r=async function(e,...t){var r=this.transaction(e,s?"readwrite":"readonly");let n=r.store;return a&&(n=n.index(t.shift())),(await Promise.all([n[i](...t),s&&r.done]))[0]};return J.set(t,r),r}}}H={...S=H,get:(e,t,r)=>K(e,t)||S.get(e,t,r),has:(e,t)=>!!K(e,t)||S.has(e,t)};class Y{constructor(e){this.container=e}getPlatformInfoString(){const e=this.container.getProviders();return e.map(e=>{if("VERSION"!==(null==(t=e.getComponent())?void 0:t.type))return null;var t,t=e.getImmediate();return`${t.library}/${t.version}`}).filter(e=>e).join(" ")}}const X="@firebase/app",q=new B("@firebase/app");var Z;const Q="[DEFAULT]",ee={"@firebase/app":"fire-core","@firebase/app-compat":"fire-core-compat","@firebase/analytics":"fire-analytics","@firebase/analytics-compat":"fire-analytics-compat","@firebase/app-check":"fire-app-check","@firebase/app-check-compat":"fire-app-check-compat","@firebase/auth":"fire-auth","@firebase/auth-compat":"fire-auth-compat","@firebase/database":"fire-rtdb","@firebase/database-compat":"fire-rtdb-compat","@firebase/functions":"fire-fn","@firebase/functions-compat":"fire-fn-compat","@firebase/installations":"fire-iid","@firebase/installations-compat":"fire-iid-compat","@firebase/messaging":"fire-fcm","@firebase/messaging-compat":"fire-fcm-compat","@firebase/performance":"fire-perf","@firebase/performance-compat":"fire-perf-compat","@firebase/remote-config":"fire-rc","@firebase/remote-config-compat":"fire-rc-compat","@firebase/storage":"fire-gcs","@firebase/storage-compat":"fire-gcs-compat","@firebase/firestore":"fire-fst","@firebase/firestore-compat":"fire-fst-compat","fire-js":"fire-js",firebase:"fire-js-all"},te=new Map,re=new Map;function ne(t,r){try{t.container.addComponent(r)}catch(e){q.debug(`Component ${r.name} failed to register with FirebaseApp ${t.name}`,e)}}function ie(e,t){e.container.addOrOverwriteComponent(t)}function ae(e){var t=e.name;if(re.has(t))return q.debug(`There were multiple attempts to register component ${t}.`),!1;re.set(t,e);for(const r of te.values())ne(r,e);return!0}function se(e,t){const r=e.container.getProvider("heartbeat").getImmediate({optional:!0});return r&&r.triggerHeartbeat(),e.container.getProvider(t)}const oe=new d("app","Firebase",{"no-app":"No Firebase App '{$appName}' has been created - call Firebase App.initializeApp()","bad-app-name":"Illegal App name: '{$appName}","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}."});class ce{constructor(e,t,r){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new _("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw oe.create("app-deleted",{appName:this._name})}}const he="9.21.0";function le(e,t={}){let r=e;if("object"!=typeof t){const i=t;t={name:i}}var n=Object.assign({name:Q,automaticDataCollectionEnabled:!1},t);const i=n.name;if("string"!=typeof i||!i)throw oe.create("bad-app-name",{appName:String(i)});if(r=r||l(),!r)throw oe.create("no-options");var a=te.get(i);if(a){if(f(r,a.options)&&f(n,a.config))return a;throw oe.create("duplicate-app",{appName:i})}const s=new I(i);for(const o of re.values())s.addComponent(o);n=new ce(r,n,s);return te.set(i,n),n}async function de(e){var t=e.name;te.has(t)&&(te.delete(t),await Promise.all(e.container.getProviders().map(e=>e.delete())),e.isDeleted=!0)}function pe(e,t,r){let n=null!==(a=ee[e])&&void 0!==a?a:e;r&&(n+=`-${r}`);var i=n.match(/\s|\//),a=t.match(/\s|\//);if(i||a){const s=[`Unable to register library "${n}" with version "${t}":`];return i&&s.push(`library name "${n}" contains illegal characters (whitespace or "/")`),i&&a&&s.push("and"),a&&s.push(`version name "${t}" contains illegal characters (whitespace or "/")`),void q.warn(s.join(" "))}ae(new _(`${n}-version`,()=>({library:n,version:t}),"VERSION"))}function ue(e,t){if(null!==e&&"function"!=typeof e)throw oe.create("invalid-log-argument");!function(a,e){for(const t of w){let i=null;e&&e.level&&(i=A[e.level]),t.userLogHandler=null===a?null:(e,t,...r)=>{var n=r.map(e=>{if(null==e)return null;if("string"==typeof e)return e;if("number"==typeof e||"boolean"==typeof e)return e.toString();if(e instanceof Error)return e.message;try{return JSON.stringify(e)}catch(e){return null}}).filter(e=>e).join(" ");t>=(null!==i&&void 0!==i?i:e.logLevel)&&a({level:C[t].toLowerCase(),message:n,args:r,type:e.name})}}}(e,t)}function fe(e){var t;t=e,w.forEach(e=>{e.setLogLevel(t)})}const ge="firebase-heartbeat-database",me=1,be="firebase-heartbeat-store";let ve=null;function _e(){return ve=ve||function(e,t,{blocked:r,upgrade:n,blocking:i,terminated:a}){const s=indexedDB.open(e,t),o=z(s);return n&&s.addEventListener("upgradeneeded",e=>{n(z(s.result),e.oldVersion,e.newVersion,z(s.transaction),e)}),r&&s.addEventListener("blocked",e=>r(e.oldVersion,e.newVersion,e)),o.then(e=>{a&&e.addEventListener("close",()=>a()),i&&e.addEventListener("versionchange",e=>i(e.oldVersion,e.newVersion,e))}).catch(()=>{}),o}(ge,me,{upgrade:(e,t)=>{0===t&&e.createObjectStore(be)}}).catch(e=>{throw oe.create("idb-open",{originalErrorMessage:e.message})}),ve}async function Ee(e,t){try{const n=await _e(),i=n.transaction(be,"readwrite"),a=i.objectStore(be);return await a.put(t,ye(e)),i.done}catch(e){var r;e instanceof o?q.warn(e.message):(r=oe.create("idb-set",{originalErrorMessage:null==e?void 0:e.message}),q.warn(r.message))}}function ye(e){return`${e.name}!${e.options.appId}`}class Ie{constructor(e){this.container=e,this._heartbeatsCache=null;var t=this.container.getProvider("app").getImmediate();this._storage=new Ce(t),this._heartbeatsCachePromise=this._storage.read().then(e=>this._heartbeatsCache=e)}async triggerHeartbeat(){const e=this.container.getProvider("platform-logger").getImmediate();var t=e.getPlatformInfoString();const r=we();if(null===this._heartbeatsCache&&(this._heartbeatsCache=await this._heartbeatsCachePromise),this._heartbeatsCache.lastSentHeartbeatDate!==r&&!this._heartbeatsCache.heartbeats.some(e=>e.date===r))return this._heartbeatsCache.heartbeats.push({date:r,agent:t}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(e=>{var t=new Date(e.date).valueOf();return Date.now()-t<=2592e6}),this._storage.overwrite(this._heartbeatsCache)}async getHeartbeatsHeader(){if(null===this._heartbeatsCache&&await this._heartbeatsCachePromise,null===this._heartbeatsCache||0===this._heartbeatsCache.heartbeats.length)return"";var e=we(),{heartbeatsToSend:t,unsentEntries:r}=function(e,t=1024){const r=[];let n=e.slice();for(const i of e){const a=r.find(e=>e.agent===i.agent);if(a){if(a.dates.push(i.date),De(r)>t){a.dates.pop();break}}else if(r.push({agent:i.agent,dates:[i.date]}),De(r)>t){r.pop();break}n=n.slice(1)}return{heartbeatsToSend:r,unsentEntries:n}}(this._heartbeatsCache.heartbeats),t=i(JSON.stringify({version:2,heartbeats:t}));return this._heartbeatsCache.lastSentHeartbeatDate=e,0<r.length?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),t}}function we(){const e=new Date;return e.toISOString().substring(0,10)}class Ce{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return!!function(){try{return"object"==typeof indexedDB}catch(e){return}}()&&new Promise((t,r)=>{try{let e=!0;const n="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(n);i.onsuccess=()=>{i.result.close(),e||self.indexedDB.deleteDatabase(n),t(!0)},i.onupgradeneeded=()=>{e=!1},i.onerror=()=>{var e;r((null===(e=i.error)||void 0===e?void 0:e.message)||"")}}catch(e){r(e)}}).then(()=>!0).catch(()=>!1)}async read(){return await this._canUseIndexedDBPromise&&await async function(e){try{const r=await _e();return r.transaction(be).objectStore(be).get(ye(e))}catch(e){var t;e instanceof o?q.warn(e.message):(t=oe.create("idb-get",{originalErrorMessage:null==e?void 0:e.message}),q.warn(t.message))}}(this.app)||{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){var r=await this.read();return Ee(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}}async add(e){var t;if(await this._canUseIndexedDBPromise){var r=await this.read();return Ee(this.app,{lastSentHeartbeatDate:null!==(t=e.lastSentHeartbeatDate)&&void 0!==t?t:r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}}}function De(e){return i(JSON.stringify({version:2,heartbeats:e})).length}Z="",ae(new _("platform-logger",e=>new Y(e),"PRIVATE")),ae(new _("heartbeat",e=>new Ie(e),"PRIVATE")),pe(X,"0.9.9",Z),pe(X,"0.9.9","esm2017"),pe("fire-js","");var Se=Object.freeze({__proto__:null,SDK_VERSION:he,_DEFAULT_ENTRY_NAME:Q,_addComponent:ne,_addOrOverwriteComponent:ie,_apps:te,_clearComponents:function(){re.clear()},_components:re,_getProvider:se,_registerComponent:ae,_removeServiceInstance:function(e,t,r=Q){se(e,t).clearInstance(r)},deleteApp:de,getApp:function(e=Q){var t=te.get(e);if(!t&&e===Q)return le();if(!t)throw oe.create("no-app",{appName:e});return t},getApps:function(){return Array.from(te.values())},initializeApp:le,onLog:ue,registerVersion:pe,setLogLevel:fe,FirebaseError:o});class Ae{constructor(e,t){this._delegate=e,this.firebase=t,ne(e,new _("app-compat",()=>this,"PUBLIC")),this.container=e.container}get automaticDataCollectionEnabled(){return this._delegate.automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this._delegate.automaticDataCollectionEnabled=e}get name(){return this._delegate.name}get options(){return this._delegate.options}delete(){return new Promise(e=>{this._delegate.checkDestroyed(),e()}).then(()=>(this.firebase.INTERNAL.removeApp(this.name),de(this._delegate)))}_getService(e,t=Q){var r;this._delegate.checkDestroyed();const n=this._delegate.container.getProvider(e);return n.isInitialized()||"EXPLICIT"!==(null===(r=n.getComponent())||void 0===r?void 0:r.instantiationMode)||n.initialize(),n.getImmediate({identifier:t})}_removeServiceInstance(e,t=Q){this._delegate.container.getProvider(e).clearInstance(t)}_addComponent(e){ne(this._delegate,e)}_addOrOverwriteComponent(e){ie(this._delegate,e)}toJSON(){return{name:this.name,automaticDataCollectionEnabled:this.automaticDataCollectionEnabled,options:this.options}}}const Oe=new d("app-compat","Firebase",{"no-app":"No Firebase App '{$appName}' has been created - call Firebase App.initializeApp()","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance."});function Le(i){const a={},s={__esModule:!0,initializeApp:function(e,t={}){var r=le(e,t);if(u(a,r.name))return a[r.name];var n=new i(r,s);return a[r.name]=n},app:o,registerVersion:pe,setLogLevel:fe,onLog:ue,apps:null,SDK_VERSION:he,INTERNAL:{registerComponent:function(r){const n=r.name,t=n.replace("-compat","");{var e;ae(r)&&"PUBLIC"===r.type&&(e=(e=o())=>{if("function"!=typeof e[t])throw Oe.create("invalid-app-argument",{appName:n});return e[t]()},void 0!==r.serviceProps&&c(e,r.serviceProps),s[t]=e,i.prototype[t]=function(...e){const t=this._getService.bind(this,n);return t.apply(this,r.multipleInstances?e:[])})}return"PUBLIC"===r.type?s[t]:null},removeApp:function(e){delete a[e]},useAsService:function(e,t){if("serverAuth"===t)return null;var r=t;return r},modularAPIs:Se}};function o(e){if(e=e||Q,!u(a,e))throw Oe.create("no-app",{appName:e});return a[e]}return s.default=s,Object.defineProperty(s,"apps",{get:function(){return Object.keys(a).map(e=>a[e])}}),o.App=i,s}var Ne=function e(){const t=Le(Ae);return t.INTERNAL=Object.assign(Object.assign({},t.INTERNAL),{createFirebaseNamespace:e,extendNamespace:function(e){c(t,e)},createSubscribe:m,ErrorFactory:d,deepExtend:c}),t}();const Be=new B("@firebase/app-compat");if("object"==typeof self&&self.self===self&&void 0!==self.firebase){Be.warn(`
    Warning: Firebase is already defined in the global scope. Please make sure
    Firebase library is only loaded once.
  `);const Pe=self.firebase.SDK_VERSION;Pe&&0<=Pe.indexOf("LITE")&&Be.warn(`
    Warning: You are trying to load Firebase while using Firebase Performance standalone script.
    You should load Firebase Performance with this instance of Firebase to avoid loading duplicate code.
    `)}const Te=Ne;pe("@firebase/app-compat","0.2.9",void 0);return Te.registerVersion("firebase","9.21.0","app-compat-cdn"),Te});
//# sourceMappingURL=firebase-app-compat.js.map