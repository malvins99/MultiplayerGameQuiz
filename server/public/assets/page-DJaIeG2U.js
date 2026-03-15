const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/QuizData-Zn2qeQzY.js","assets/index-3vZSclUO.js"])))=>i.map(i=>d[i]);
import{a as I,s as k,S as L,T as u,l as $,R as w,L as _,_ as z}from"./index-3vZSclUO.js";import{initializeGame as O}from"./game-Bo057JUq.js";import"./characterData-qCqug7LG.js";class T{static async createRoom(t,o){const{difficulty:e,questionCount:s,timer:l,quiz:r}=o;let m="map_newest_easy_nomor1.tmj";e==="sedang"&&(m="map_baru2.tmj"),e==="sulit"&&(m="map_baru3.tmj");const i=s===5?10:20,n=this.generateRoomCode(),g=I.getStoredProfile(),b=g?g.id:null;let a=[...r.questions||[]];a.sort(()=>Math.random()-.5),a=a.slice(0,s);try{const{data:d,error:h}=await k.from(L).insert({game_pin:n,quiz_id:r.id,status:"waiting",question_limit:s,total_time_minutes:l/60,difficulty:e,host_id:b,created_at:new Date().toISOString(),current_questions:a}).select().single();if(h)throw console.error("Supabase Session Error:",h),new Error("Failed to create game session.");console.log("Session Created in Supabase B:",d);const p={roomCode:n,sessionId:d.id,difficulty:e,subject:r.category.toLowerCase(),quizId:r.id,quizTitle:r.title,questions:a,map:m,questionCount:s,enemyCount:i,timer:l,isHost:!0,hostId:b,quizDetail:{title:r.title,category:r.category,language:r.language||"id",description:r.description,creator_avatar:r.creator_avatar||null,creator_username:r.creator_username||"kizuko"}};localStorage.setItem("currentRoomOptions",JSON.stringify(p));const c=await t.create("game_room",p);return console.log("Room created via RoomService!",c),localStorage.setItem("currentRoomId",c.id),localStorage.setItem("currentSessionId",c.sessionId),localStorage.setItem("currentReconnectionToken",c.reconnectionToken),{room:c,options:p}}catch(d){throw console.error("RoomService Flow Error:",d),d}}static generateRoomCode(){return Math.floor(1e5+Math.random()*9e5).toString()}}class S{static getGlobalStyles(){return`
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
            @media (min-width: 768px) {
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
        `}static generateHTML(t){const o=[t[0],t[1],t[2]],e=t,s=i=>{const n=Math.floor(i/1e3);return`${n/60<1?"":Math.floor(n/60).toString()+":"}${(n%60).toString().padStart(2,"0")}s`},r=[o[1],o[0],o[2]].map(i=>{if(!i)return'<div class="w-[100px] md:w-[150px]"></div>';const n=i.rank,g=n===1,b=n===2;let a="#cd7f32",d="bg-orange-900/40",h="rgba(205,127,50,0.5)",p="military_tech",c="h-32",x="w-[100px] md:w-[140px]",f="w-20 h-20 md:w-28 md:h-28";g?(a="#ffcc00",d="bg-yellow-600/40",h="rgba(255,204,0,0.6)",p="emoji_events",c="h-48 md:h-56",x="w-[120px] md:w-[180px]",f="w-24 h-24 md:w-32 md:h-32"):b&&(a="#c0c0c0",d="bg-gray-600/40",h="rgba(192,192,192,0.5)",c="h-40 md:h-44");const y=i.hairId?["bowlhair","curlyhair","longhair","mophair","shorthair","spikeyhair"][i.hairId-1]:null;return`
                <div class="flex flex-col items-center relative z-20 group">


                    <div class="${f} podium-avatar rounded-full bg-black/80 border-4 shadow-[0_0_20px_${h}] flex items-center justify-center font-bold mb-4 relative backdrop-blur-sm group-hover:-translate-y-2 transition-transform duration-300" style="color: ${a}; border-color: ${a}">
                        <!-- Character Animation -->
                        <div class="char-anim" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${y?`<div class="char-anim" style="background-image: url('/assets/${y}_idle_strip9.png')"></div>`:""}
                        

                    </div>

                    <div class="text-white text-xs md:text-base mb-2 truncate max-w-[100px] md:max-w-[160px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center">${i.name}</div>

                    <div class="${x} ${c} rounded-t-2xl border-4 border-b-0 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md" style="border-color: ${a}; background: linear-gradient(to top, rgba(0,0,0,0.9), ${d}); box-shadow: inset 0 0 30px ${h}, 0 -5px 20px ${h}">
                        <div class="absolute inset-0 bg-[url('/assets/bg_pattern.png')] opacity-10 mix-blend-overlay"></div>
                        <div class="text-2xl md:text-5xl font-bold mb-2 drop-shadow-[0_0_10px_rgba(0,0,0,1)] relative z-10" style="color: ${a}">${i.score}</div>
                        <span class="material-symbols-outlined text-4xl md:text-6xl opacity-40 relative z-10" style="color: ${a}">${p}</span>
                    </div>
                </div>
            `}).join(""),m=e.map(i=>{const n=i.hairId?["bowlhair","curlyhair","longhair","mophair","shorthair","spikeyhair"][i.hairId-1]:null;return`
            <div class="grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[100px_1fr_150px_150px] p-4 text-white items-center border-b border-white/5 hover:bg-white/5 transition-colors group">
                <div class="text-center font-bold text-white/50 group-hover:text-primary transition-colors text-xs md:text-base">${i.rank}</div>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center font-bold text-xs md:text-sm group-hover:border-primary transition-colors overflow-hidden relative podium-avatar">
                        <div class="char-anim-sm" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${n?`<div class="char-anim-sm" style="background-image: url('/assets/${n}_idle_strip9.png')"></div>`:""}
                    </div>
                    <div class="font-bold text-xs md:text-base truncate max-w-[120px] md:max-w-[300px]">${i.name}</div>
                </div>
                <div class="text-center text-primary font-bold text-sm md:text-lg drop-shadow-[0_0_5px_rgba(0,255,85,0.3)]">${i.score}</div>
                <div class="text-center flex border-white/10 items-center justify-center gap-1 text-white/50 text-xs md:text-sm">
                    <span class="material-symbols-outlined text-sm">timer</span>
                    ${s(i.duration)}
                </div>
            </div>
        `}).join("");return`
            <div class="fixed inset-0 w-full h-screen overflow-hidden fantasy-bg text-white pointer-events-auto select-none">
                
                <!-- GameForSmart Logo - Top Right Corner -->
                <div class="absolute top-4 right-4 md:top-6 md:right-6 z-50">
                    <img src="/logo/gameforsmart-logo-fix.webp" alt="GameForSmart" draggable="false"
                        class="w-32 h-auto md:w-56 object-contain drop-shadow-[0_0_10px_rgba(0,255,85,0.4)] hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(0,255,85,0.6)] transition-all duration-300" />
                </div>

                <!-- Zigma Logo - Top Left Corner -->
                <div class="absolute top-4 left-4 md:top-6 md:left-6 z-50">
                    <img src="/logo/Zigma-logo-fix.webp" alt="Zigma" draggable="false"
                        class="w-24 h-auto md:w-32 object-contain drop-shadow-[0_0_10px_rgba(0,255,85,0.4)] hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(0,255,85,0.6)] transition-all duration-300" />
                </div>

                <!-- Fantasy Forest Gradient Overlay -->
                <div class="absolute inset-0 pointer-events-none"
                    style="background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);"></div>

                <!-- Mystical Fog Layer -->
                <div class="absolute inset-0 pointer-events-none mystical-fog"></div>
                <div class="absolute inset-0 pointer-events-none mystical-fog"
                    style="animation-delay: 5s; animation-direction: reverse;"></div>

                <!-- Magic Firefly Particles -->
                <div class="firefly" style="top: 20%; left: 10%; animation-delay: 0s; animation-duration: 7s;"></div>
                <div class="firefly" style="top: 60%; left: 85%; animation-delay: 1s; animation-duration: 5s;"></div>
                <div class="firefly" style="top: 30%; left: 50%; animation-delay: 2s; animation-duration: 6s;"></div>
                <div class="firefly" style="top: 80%; left: 30%; animation-delay: 0.5s; animation-duration: 8s;"></div>
                <div class="firefly" style="top: 15%; left: 70%; animation-delay: 1.5s; animation-duration: 7s;"></div>

                <!-- Glowing Orbs -->
                <div class="absolute top-1/4 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
                <div class="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style="animation-delay: 1s;"></div>

                <!-- Bottom Forest Silhouette -->
                <div class="absolute bottom-0 left-0 right-0 h-32 pointer-events-none forest-silhouette opacity-50"></div>

                <!-- MAIN CONTENT AREA -->
                <div class="relative z-10 w-full h-full flex flex-col items-center pt-24 pb-12 px-4 overflow-y-auto custom-scrollbar">
                    


                    <!-- Podiums -->
                    <div class="flex items-end justify-center gap-2 md:gap-8 mb-12">
                        ${r}
                    </div>

                    <!-- Leaderboard Table Card -->
                    ${e.length>0?`
                    <div class="w-full max-w-4xl bg-[#1a1a20]/90 backdrop-blur-md border-[3px] border-primary/30 rounded-3xl shadow-[0_0_50px_rgba(0,255,85,0.1)] overflow-hidden shrink-0 mb-20">
                        <!-- Header -->
                        <div class="bg-black/80 border-b-[3px] border-primary/20 relative">
                            <div class="grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[100px_1fr_150px_150px] p-4 md:p-5 font-bold text-primary/80 uppercase tracking-widest text-[10px] md:text-xs">
                                <div class="text-center">RANK</div>
                                <div>PLAYER</div>
                                <div class="text-center">SCORE</div>
                                <div class="text-center">TIME</div>
                            </div>
                        </div>
                        
                        <!-- List -->
                        <div class="flex flex-col">
                            ${m}
                        </div>
                    </div>
                    `:""}
                </div>

                <!-- FLOATING ACTIONS (Left & Right) -->
                <div class="fixed top-[40%] md:top-1/2 left-4 md:left-6 -translate-y-1/2 flex flex-col gap-4 z-50">
                    <button id="lb-home-btn" class="w-14 h-14 md:w-16 md:h-16 bg-[#1a1a20]/80 backdrop-blur-md border-2 border-white/10 hover:border-primary text-white/70 hover:text-primary rounded-2xl flex items-center justify-center transition-all group hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,255,85,0.2)]" title="Home">
                        <span class="material-symbols-outlined text-2xl md:text-3xl group-hover:scale-110 transition-transform">home</span>
                    </button>
                    <button id="lb-restart-btn" class="w-14 h-14 md:w-16 md:h-16 bg-[#1a1a20]/80 backdrop-blur-md border-2 border-white/10 hover:border-secondary text-white/70 hover:text-secondary rounded-2xl flex items-center justify-center transition-all group hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,212,255,0.2)]" title="Play Again">
                        <span class="material-symbols-outlined text-2xl md:text-3xl group-hover:-rotate-180 transition-transform duration-500">restart_alt</span>
                    </button>
                </div>

                <div class="fixed top-[40%] md:top-1/2 right-4 md:right-6 -translate-y-1/2 flex flex-col gap-4 z-50">
                    <button id="lb-stats-btn" class="w-14 h-14 md:w-16 md:h-16 bg-[#1a1a20]/80 backdrop-blur-md border-2 border-white/10 hover:border-accent text-white/70 hover:text-accent rounded-2xl flex items-center justify-center transition-all group hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(204,0,255,0.2)]" title="Statistics">
                        <span class="material-symbols-outlined text-2xl md:text-3xl group-hover:scale-110 transition-transform">analytics</span>
                    </button>
                </div>
            </div>
        `}}class E{constructor(){this.rankings=[],this.sessionId=null,this.isHost=!0}start(t){this.initializeClient(),u.ensureClosed();let o=t==null?void 0:t.rankings;if(!o||o.length===0){const e=localStorage.getItem("hostLeaderboardData");if(e)try{o=JSON.parse(e)}catch{}}else localStorage.setItem("hostLeaderboardData",JSON.stringify(o));if(this.rankings=o||[],this.rankings.sort((e,s)=>e.rank-s.rank),this.isHost=(t==null?void 0:t.isHost)!==void 0?t.isHost:!0,this.opts=t==null?void 0:t.lastGameOptions,this.opts)localStorage.setItem("hostLastGameOptions",JSON.stringify(this.opts));else{const e=localStorage.getItem("hostLastGameOptions");if(e)try{this.opts=JSON.parse(e)}catch{}}if(this.q=t==null?void 0:t.lastSelectedQuiz,this.q)localStorage.setItem("hostLastSelectedQuiz",JSON.stringify(this.q));else{const e=localStorage.getItem("hostLastSelectedQuiz");if(e)try{this.q=JSON.parse(e)}catch{}}this.sessionId=(t==null?void 0:t.mySessionId)||null,this.sessionId?this.sessionId&&localStorage.setItem("hostLastSessionId",this.sessionId):this.sessionId=localStorage.getItem("hostLastSessionId"),this.container=document.createElement("div"),this.container.id="leaderboard-ui",this.container.style.cssText='position:absolute; top:0; left:0; width:100%; height:100%; z-index:1000; font-family: "Retro Gaming", monospace !important;',document.body.appendChild(this.container),this.renderLeaderboard(),setTimeout(()=>u.open(),100)}initializeClient(){let o;if(!o){const e=window.location.protocol==="https:"?"wss":"ws";o=`${e}://${window.location.host}`,window.location.hostname==="localhost"&&(o=`${e}://localhost:2567`)}this.client=new $.Client(o)}renderLeaderboard(){const t="leaderboard-local-styles";if(!document.getElementById(t)){const o=document.createElement("style");o.id=t,o.innerHTML=S.getGlobalStyles(),document.head.appendChild(o)}w.navigate("/host/leaderboard"),this.container.innerHTML=S.generateHTML(this.rankings),this.attachListeners()}attachListeners(){const t=document.getElementById("lb-home-btn"),o=document.getElementById("lb-restart-btn"),e=document.getElementById("lb-stats-btn");e&&(e.onclick=()=>{var l,r,m;const s=((l=this.opts)==null?void 0:l.sessionId)||localStorage.getItem("supabaseSessionId")||((m=(r=localStorage.getItem("lastGameOptions"))==null?void 0:r.match(/"sessionId":"([^"]+)"/))==null?void 0:m[1])||this.sessionId||localStorage.getItem("hostLastSessionId");s?window.open(`https://gameforsmartnewui.vercel.app/stat/${s}`,"_blank"):alert("ID Sesi tidak ditemukan. Tidak dapat membuka statistik.")}),t&&(t.onclick=()=>{u.close(()=>{this.cleanup(),window.history.pushState({},"","/"),new _().init()})}),o&&(o.onclick=async()=>{if(this.opts&&!this.q&&this.opts.quizId)try{this.q=await z(()=>import("./QuizData-Zn2qeQzY.js"),__vite__mapDeps([0,1])).then(s=>s.fetchQuizById(this.opts.quizId)),this.q&&localStorage.setItem("hostLastSelectedQuiz",JSON.stringify(this.q))}catch(s){console.error("Failed to fetch quiz for restart:",s)}this.opts&&this.q?u.close(async()=>{try{const{room:s,options:l}=await T.createRoom(this.client,{...this.opts,quiz:this.q});this.cleanup(),w.navigate(`/host/${l.roomCode}/lobby`),O("HostWaitingRoomScene",{room:s,isHost:!0}),setTimeout(()=>u.open(),600)}catch(s){console.error(s),alert("Restart error. Returning to lobby."),this.cleanup(),new _().init()}}):alert("Tidak dapat menemukan data kuis untuk mengulang permainan. Silakan kembali ke Lobby.")})}cleanup(){this.container&&(this.container.parentNode&&this.container.parentNode.removeChild(this.container),this.container.remove());const t=document.getElementById("leaderboard-local-styles");t&&(t.parentNode&&t.parentNode.removeChild(t),t.remove())}}export{E as HostLeaderboardManager};
