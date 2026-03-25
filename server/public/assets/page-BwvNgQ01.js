const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/QuizData-DoIlblE9.js","assets/index-CCyGaY2A.js"])))=>i.map(i=>d[i]);
import{a as I,s as _,S as z,T as g,l as L,R as y,L as w,_ as E}from"./index-CCyGaY2A.js";import{initializeGame as C}from"./game-BmHy_WgG.js";import{O as k}from"./OrientationManager-Br2LilYK.js";import"./characterData-qCqug7LG.js";class O{static async createRoom(t,e){const{difficulty:i,questionCount:a,timer:f,quiz:n}=e;let p="map_newest_easy_nomor1.tmj";i==="sedang"&&(p="map_baru2.tmj"),i==="sulit"&&(p="map_baru3.tmj");const s=a===5?10:20,l=this.generateRoomCode(),o=I.getStoredProfile(),c=o?o.id:null;let r=[...n.questions||[]];r.sort(()=>Math.random()-.5),r=r.slice(0,a);try{const{data:d,error:h}=await _.from(z).insert({game_pin:l,quiz_id:n.id,status:"waiting",question_limit:a,total_time_minutes:f/60,difficulty:i,host_id:c,created_at:new Date().toISOString(),current_questions:r}).select().single();if(h)throw console.error("Supabase Session Error:",h),new Error("Failed to create game session.");console.log("Session Created in Supabase B:",d);const m={roomCode:l,sessionId:d.id,difficulty:i,subject:n.category.toLowerCase(),quizId:n.id,quizTitle:n.title,questions:r,map:p,questionCount:a,enemyCount:s,timer:f,isHost:!0,hostId:c,quizDetail:{title:n.title,category:n.category,language:n.language||"id",description:n.description,creator_avatar:n.creator_avatar||null,creator_username:n.creator_username||"kizuko"}};localStorage.setItem("currentRoomOptions",JSON.stringify(m));const b=await t.create("game_room",m);return console.log("Room created via RoomService!",b),localStorage.setItem("currentRoomId",b.id),localStorage.setItem("currentSessionId",b.sessionId),localStorage.setItem("currentReconnectionToken",b.reconnectionToken),localStorage.setItem("supabaseSessionId",d.id),{room:b,options:m}}catch(d){throw console.error("RoomService Flow Error:",d),d}}static generateRoomCode(){return Math.floor(1e5+Math.random()*9e5).toString()}}class S{static getGlobalStyles(){return`
            .podium-avatar { position: relative; display: flex; justify-content: center; align-items: center; overflow: hidden; }
            .char-anim { 
                width: 96px; 
                height: 64px; 
                image-rendering: pixelated; 
                position: absolute; 
                transform: scale(4); 
                animation: lb-play-idle 1s steps(9) infinite; 
            }
            @keyframes lb-play-idle { 
                from { background-position: 0 0; } 
                to { background-position: -864px 0; } 
            }
            .pixel-bg-pattern { background-image: radial-gradient(#2d5a30 1px, transparent 1px); background-size: 24px 24px; }
            .firefly { position: absolute; width: 4px; height: 4px; background: #FEFF9F; border-radius: 50%; filter: blur(1px); animation: firefly-bounce 4s infinite ease-in-out; z-index: 1; pointer-events: none; }
            @keyframes firefly-bounce { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; } 50% { transform: translateY(-20px) scale(1.2); opacity: 1; } }
            @keyframes drift { from { transform: translateX(-100%) scale(var(--s)); } to { transform: translateX(100vw) scale(var(--s)); } }
            @keyframes drift-reverse { from { transform: translateX(100vw) scale(var(--s)); } to { transform: translateX(-100%) scale(var(--s)); } }
            .cloud { position: absolute; pointer-events: none; }
            @keyframes base-walk-cycle { from { background-position: 0 0; } to { background-position: -768px 0; } }
            @keyframes walk-across-right { from { transform: translate3d(-100px, 0, 0) scale(1.5, 1.5); } to { transform: translate3d(100vw, 0, 0) scale(1.5, 1.5); } }
            @keyframes walk-across-left { from { transform: translate3d(100vw, 0, 0) scale(-1.5, 1.5); } to { transform: translate3d(-100px, 0, 0) scale(-1.5, 1.5); } }
            .walking-char { position: absolute; bottom: 20px; left: 0; width: 96px; height: 64px; background-image: url('/assets/base_walk_strip8.png'); background-size: 768px 64px; image-rendering: pixelated; z-index: 2; pointer-events: none; will-change: transform; }
            .logo-center { position: fixed; top: 25px; left: 0; right: 0; margin: 0 auto; width: 200px; z-index: 2000; pointer-events: none; display: none; }
            .logo-left { position: absolute; top: -30px; left: -40px; width: 280px; z-index: 20; pointer-events: none; }
            .logo-right { position: absolute; top: -45px; right: -15px; width: 320px; z-index: 20; pointer-events: none; }
            .lb-footer-mobile { display: none; }
            .desktop-floating-actions { display: none; }
            .nav-btn {
                pointer-events: auto; background: #92C140; border: none; border-bottom: 4px solid #386938; border-radius: 12px;
                width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.2s;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            }
            .nav-btn:hover { filter: brightness(110%); }
            .nav-btn:active { transform: translateY(4px); border-bottom-width: 0; }
            .nav-btn .material-symbols-outlined { font-size: 30px; }
            @media (max-width: 768px) {
                .logo-left, .logo-right { display: none; }
                .logo-center { display: block; width: 8rem; top: 10px; }
                .lb-footer-mobile {
                    display: flex; position: fixed; bottom: 12px; left: 0; width: 100%; flex-direction: row; gap: 8px; padding: 0 10px; z-index: 100;
                }
                .nav-btn-wide {
                    flex: 1; pointer-events: auto; height: 44px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center; gap: 4px;
                    font-family: 'Retro Gaming', monospace; font-size: 9px; text-transform: uppercase;
                    border: none; cursor: pointer; transition: all 0.2s;
                    background: #92C140; color: white; border-bottom: 3px solid #478D47; box-shadow: 0 6px 0 #478D47;
                }
                .nav-btn-wide:active { transform: translateY(2px); border-bottom-width: 2px; box-shadow: 0 4px 0 #478D47; }
            }
            @media (min-width: 768px) {
                .desktop-floating-actions {
                    display: flex;
                }
                .char-anim { transform: scale(5.5); }
                .char-anim-sm { transform: scale(1.8); }
            }
            .char-anim-sm { 
                width: 96px; 
                height: 64px; 
                image-rendering: pixelated; 
                position: absolute; 
                transform: scale(1.3); 
                animation: lb-play-idle 1s steps(9) infinite; 
            }
        `}static generateHTML(t){const e=[t[0],t[1],t[2]],i=t,a=s=>{const l=Math.floor(s/1e3),o=Math.floor(l/60),c=l%60;return`${o}:${c.toString().padStart(2,"0")}`},n=[e[1],e[0],e[2]].map(s=>{if(!s)return'<div class="w-[100px] md:w-[150px]"></div>';const l=s.rank,o=l===1,c=l===2;let r="#cd7f32",d="bg-orange-900/40",h="military_tech",m="h-32",b="w-[100px] md:w-[140px]",v="w-20 h-20 md:w-28 md:h-28";o?(r="#ffcc00",d="bg-yellow-600/40",h="emoji_events",m="h-48 md:h-56",b="w-[120px] md:w-[180px]",v="w-24 h-24 md:w-32 md:h-32"):c&&(r="#c0c0c0",d="bg-gray-600/40",m="h-40 md:h-44");const x=s.hairId?["bowlhair","curlyhair","longhair","mophair","shorthair","spikeyhair"][s.hairId-1]:null;return`
                <div class="flex flex-col items-center relative z-20 group">


                    <div class="${v} podium-avatar rounded-full border-4 flex items-center justify-center font-bold mb-4 relative" style="background-color: ${r}; border-color: ${r};">
                        <!-- Character Animation -->
                        <div class="char-anim" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${x?`<div class="char-anim" style="background-image: url('/assets/${x}_idle_strip9.png')"></div>`:""}
                        
                    </div>

                    <div class="text-sm md:text-2xl mb-2 font-bold text-center leading-tight drop-shadow-lg" style="color: ${r}; font-family: 'Retro Gaming', monospace; text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000; letter-spacing: 1px;">${s.name}</div>

                    <!-- The literal podium block (Hidden on mobile) -->
                    <div class="hidden md:flex ${b} ${m} rounded-t-2xl border-4 border-b-0 flex-col items-center justify-center relative overflow-hidden" style="border-color: ${r}; background: linear-gradient(to top, rgba(0,0,0,0.9), ${d});">
                        <div class="absolute inset-0 bg-[url('/assets/bg_pattern.png')] opacity-10"></div>
                        <div class="text-2xl md:text-5xl font-bold mb-2 drop-shadow-[0_0_10px_rgba(0,0,0,1)] relative z-10" style="color: ${r}">${s.score}</div>
                        <span class="material-symbols-outlined text-4xl md:text-6xl opacity-40 relative z-10" style="color: ${r}">${h}</span>
                    </div>
                </div>
            `}).join(""),p=i.map(s=>{const l=s.hairId?["bowlhair","curlyhair","longhair","mophair","shorthair","spikeyhair"][s.hairId-1]:null;return`
            <div class="grid grid-cols-[40px_1fr_60px_60px] md:grid-cols-[100px_1fr_150px_150px] p-4 text-white items-center border-b border-white/5 hover:bg-white/5 transition-colors group">
                <div class="text-center font-bold text-white/50 group-hover:text-primary transition-colors text-xs md:text-base">${s.rank}</div>
                <div class="flex items-center gap-2 md:gap-3">
                    <div class="hidden md:flex w-10 h-10 rounded-full bg-[#e2e8f0]/95 border-2 border-white/10 items-center justify-center font-bold text-sm group-hover:border-primary transition-colors overflow-hidden relative podium-avatar">
                        <div class="char-anim-sm" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${l?`<div class="char-anim-sm" style="background-image: url('/assets/${l}_idle_strip9.png')</div>`:""}
                    </div>
                    <div class="font-bold text-[10px] md:text-base truncate max-w-[150px] md:max-w-[300px]">${s.name}</div>
                </div>
                <div class="text-center text-primary font-bold text-xs md:text-lg">${s.score}</div>
                <div class="text-center text-white/50 text-[10px] md:text-sm font-bold">
                    ${a(s.duration)}
                </div>
            </div>
        `}).join("");return`
            <div class="fixed inset-0 w-full h-screen overflow-hidden text-white pointer-events-auto select-none" style="background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);">
                
                <!-- Pixel-art Background Decorations -->
                <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <div class="absolute inset-0 pixel-bg-pattern opacity-[0.06]"></div>

                    <!-- Clouds -->
                    <div class="cloud top-[10%] opacity-20 animate-[drift_80s_linear_infinite]" style="--s: 1.0; left: -10%;">
                        <div class="relative w-10 h-3 bg-white"><div class="absolute -top-1 left-2 w-3 h-1 bg-white"></div></div>
                    </div>
                    <div class="cloud top-[45%] opacity-15 animate-[drift-reverse_95s_linear_infinite]" style="--s: 0.8; left: 80%;">
                        <div class="relative w-12 h-4 bg-[#D3EE98]"><div class="absolute -top-2 left-3 w-4 h-2 bg-[#D3EE98]"></div></div>
                    </div>
                    <div class="cloud top-[15%] opacity-15 animate-[drift_110s_linear_infinite]" style="--s: 1.2; left: 40%;">
                        <div class="relative w-14 h-4 bg-white"><div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div></div>
                    </div>

                    <!-- Fireflies -->
                    <div class="firefly" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                    <div class="firefly" style="top: 65%; left: 80%; animation-delay: 1.5s;"></div>
                    <div class="firefly" style="top: 45%; left: 45%; animation-delay: 3s;"></div>
                    <div class="firefly" style="top: 15%; left: 30%; animation-delay: 1.2s; animation-duration: 5s;"></div>
                    <div class="firefly" style="top: 85%; left: 20%; animation-delay: 2.1s; animation-duration: 6s;"></div>
                </div>

                <!-- Walking Characters Container -->
                <div id="leaderboard-walking-characters-container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>

                <!-- Logos -->
                <img src="/logo/Zigma-logo-fix.webp" alt="Zigma Logo" class="logo-center" />
                <img src="/logo/Zigma-logo-fix.webp" alt="Zigma Logo" class="logo-left" />
                <img src="/logo/gameforsmart-logo-fix.webp" alt="GameForSmart Logo" class="logo-right" />

                <!-- MAIN CONTENT AREA: overflow-hidden for mobile to prevent scrollbars, auto for desktop -->
                <div class="relative z-10 w-full h-[100dvh] flex flex-col items-center pt-24 md:pt-28 pb-20 md:pb-12 px-4 overflow-hidden md:overflow-y-auto custom-scrollbar">
                    


                    <!-- Podiums (Keep wrapper flex but adjust bottom margin for mobile) -->
                    <div class="flex items-end justify-center gap-2 md:gap-8 mb-4 md:mb-12 shrink-0">
                        ${n}
                    </div>

                    <!-- Leaderboard Table Card -->
                    ${i.length>0?`
                    <div class="w-full max-w-4xl bg-[#1a1a20]/90 border-[3px] border-primary/30 rounded-3xl shadow-[0_0_50px_rgba(0,255,85,0.1)] overflow-hidden shrink-0 md:mb-20 flex flex-col flex-1 md:flex-none min-h-0">
                        <!-- Header -->
                        <div class="bg-black/80 border-b-[3px] border-primary/20 relative shrink-0">
                            <div class="grid grid-cols-[40px_1fr_60px_60px] md:grid-cols-[100px_1fr_150px_150px] p-4 md:p-5 font-bold text-primary/80 uppercase tracking-widest text-[8px] md:text-xs">
                                <div class="text-center">RANK</div>
                                <div>PLAYER</div>
                                <div class="text-center">SCORE</div>
                                <div class="text-center">TIME</div>
                            </div>
                        </div>
                        
                        <!-- List (Make internal scrollable on mobile so we don't need body scroll) -->
                        <div class="flex flex-col overflow-y-auto custom-scrollbar flex-1 min-h-0 pb-4 md:pb-0">
                            ${p}
                        </div>
                    </div>
                    `:""}
                </div>

                <!-- FLOATING ACTIONS (Left & Right) -->
                <div class="desktop-floating-actions fixed top-[40%] md:top-1/2 left-4 md:left-6 -translate-y-1/2 flex-col gap-4 z-50">
                    <button id="lb-home-btn" class="nav-btn" title="Home">
                        <span class="material-symbols-outlined">home</span>
                    </button>
                    <button id="lb-restart-btn" class="nav-btn" title="Play Again">
                        <span class="material-symbols-outlined">restart_alt</span>
                    </button>
                </div>

                <div class="desktop-floating-actions fixed top-[40%] md:top-1/2 right-4 md:right-6 -translate-y-1/2 flex-col gap-4 z-50">
                    <button id="lb-stats-btn" class="nav-btn" title="Statistics">
                        <span class="material-symbols-outlined">analytics</span>
                    </button>
                </div>

                <!-- MOBILE FOOTER ACTIONS -->
                <div class="lb-footer-mobile">
                    <button id="lb-home-btn-mobile" class="nav-btn-wide">
                        <span class="material-symbols-outlined text-[14px]">home</span>HOME
                    </button>
                    <button id="lb-restart-btn-mobile" class="nav-btn-wide">
                        <span class="material-symbols-outlined text-[14px]">restart_alt</span>RESTART
                    </button>
                    <button id="lb-stats-btn-mobile" class="nav-btn-wide">
                        <span class="material-symbols-outlined text-[14px]">analytics</span>STATS
                    </button>
                </div>
            </div>
        `}}class M{constructor(){this.rankings=[],this.sessionId=null,this.isHost=!0,this.spawnerInterval=null}start(t){this.initializeClient(),g.ensureClosed(),k.requirePortrait("MODE PORTRAIT DIPERLUKAN","mode potrait di perlukan");let e=t==null?void 0:t.rankings;if(!e||e.length===0){const i=localStorage.getItem("hostLeaderboardData");if(i)try{e=JSON.parse(i)}catch{}}else localStorage.setItem("hostLeaderboardData",JSON.stringify(e));if(this.rankings=e||[],this.rankings.sort((i,a)=>i.rank-a.rank),this.isHost=(t==null?void 0:t.isHost)!==void 0?t.isHost:!0,this.opts=t==null?void 0:t.lastGameOptions,this.opts)localStorage.setItem("hostLastGameOptions",JSON.stringify(this.opts));else{const i=localStorage.getItem("hostLastGameOptions");if(i)try{this.opts=JSON.parse(i)}catch{}}if(this.q=t==null?void 0:t.lastSelectedQuiz,this.q)localStorage.setItem("hostLastSelectedQuiz",JSON.stringify(this.q));else{const i=localStorage.getItem("hostLastSelectedQuiz");if(i)try{this.q=JSON.parse(i)}catch{}}this.sessionId=(t==null?void 0:t.mySessionId)||null,this.sessionId?this.sessionId&&localStorage.setItem("hostLastSessionId",this.sessionId):this.sessionId=localStorage.getItem("hostLastSessionId"),this.container=document.createElement("div"),this.container.id="leaderboard-ui",this.container.style.cssText='position:absolute; top:0; left:0; width:100%; height:100%; z-index:1000; font-family: "Retro Gaming", monospace !important;',document.body.appendChild(this.container),this.renderLeaderboard(),setTimeout(()=>g.open(),100)}initializeClient(){let e;if(!e){const i=window.location.protocol==="https:"?"wss":"ws";e=`${i}://${window.location.host}`,window.location.hostname==="localhost"&&(e=`${i}://localhost:2567`)}this.client=new L.Client(e)}renderLeaderboard(){const t="leaderboard-local-styles";if(!document.getElementById(t)){const e=document.createElement("style");e.id=t,e.innerHTML=S.getGlobalStyles(),document.head.appendChild(e)}y.navigate("/host/leaderboard"),this.container.innerHTML=S.generateHTML(this.rankings),this.startCharacterSpawner(),this.attachListeners()}attachListeners(){const t=document.getElementById("lb-home-btn"),e=document.getElementById("lb-restart-btn"),i=document.getElementById("lb-stats-btn"),a=document.getElementById("lb-home-btn-mobile"),f=document.getElementById("lb-restart-btn-mobile"),n=document.getElementById("lb-stats-btn-mobile"),p=()=>{var c,r,d,h,m;let o=((c=this.opts)==null?void 0:c.sessionId)||localStorage.getItem("supabaseSessionId");!o&&this.rankings.length>0&&(o=this.rankings[0].sessionId),o||(o=((d=(r=localStorage.getItem("lastGameOptions"))==null?void 0:r.match(/"sessionId":"([^"]+)"/))==null?void 0:d[1])||((m=(h=localStorage.getItem("hostLastGameOptions"))==null?void 0:h.match(/"sessionId":"([^"]+)"/))==null?void 0:m[1])),o&&o!=="undefined"&&o!=="null"?window.open(`https://gameforsmartnewui.vercel.app/stat/${o}`,"_blank"):alert("ID Sesi tidak ditemukan. Tidak dapat membuka statistik.")};i&&(i.onclick=p),n&&(n.onclick=p);const s=()=>{g.close(()=>{this.cleanup(),window.history.pushState({},"","/"),new w().init()})};t&&(t.onclick=s),a&&(a.onclick=s);const l=async()=>{if(this.opts&&!this.q&&this.opts.quizId)try{this.q=await E(()=>import("./QuizData-DoIlblE9.js"),__vite__mapDeps([0,1])).then(o=>o.fetchQuizById(this.opts.quizId)),this.q&&localStorage.setItem("hostLastSelectedQuiz",JSON.stringify(this.q))}catch(o){console.error("Failed to fetch quiz for restart:",o)}this.opts&&this.q?g.close(async()=>{try{const{room:o,options:c}=await O.createRoom(this.client,{...this.opts,quiz:this.q});this.cleanup(),y.navigate(`/host/${c.roomCode}/lobby`),C("HostWaitingRoomScene",{room:o,isHost:!0}),setTimeout(()=>g.open(),600)}catch(o){console.error(o),alert("Restart error. Returning to lobby."),this.cleanup(),new w().init()}}):alert("Tidak dapat menemukan data kuis untuk mengulang permainan. Silakan kembali ke Lobby.")};e&&(e.onclick=l),f&&(f.onclick=l)}cleanup(){this.spawnerInterval&&(clearInterval(this.spawnerInterval),this.spawnerInterval=null),this.container&&(this.container.parentNode&&this.container.parentNode.removeChild(this.container),this.container.remove());const t=document.getElementById("leaderboard-local-styles");t&&(t.parentNode&&t.parentNode.removeChild(t),t.remove()),k.disable()}startCharacterSpawner(){if(this.spawnerInterval)return;const t=document.getElementById("leaderboard-walking-characters-container");t&&(this.checkAndSpawn(t),this.spawnerInterval=setInterval(()=>this.checkAndSpawn(t),5e3))}checkAndSpawn(t){const e=t.querySelectorAll(".walking-char").length;e>=3||Math.random()<(e===0?.8:.4)&&this.spawnCharacter(t)}spawnCharacter(t){const e=document.createElement("div");e.className="walking-char";const i=Math.random()>.5,a=20+Math.random()*10;i?e.style.animation=`base-walk-cycle 0.8s steps(8) infinite, walk-across-left ${a}s linear forwards`:e.style.animation=`base-walk-cycle 0.8s steps(8) infinite, walk-across-right ${a}s linear forwards`,t.appendChild(e),setTimeout(()=>{e.parentElement&&e.remove()},a*1e3+500)}}export{M as HostLeaderboardManager};
