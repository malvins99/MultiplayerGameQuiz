const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/QuizData-BeTiwLY1.js","assets/index-CU7EXP-X.js"])))=>i.map(i=>d[i]);
import{a as I,s as k,S as L,T as u,l as $,R as w,L as _,_ as z}from"./index-CU7EXP-X.js";import{initializeGame as O}from"./game-BER8PLQX.js";import"./characterData-qCqug7LG.js";class T{static async createRoom(t,o){const{difficulty:s,questionCount:e,timer:d,quiz:a}=o;let m="map_newest_easy_nomor1.tmj";s==="sedang"&&(m="map_baru2.tmj"),s==="sulit"&&(m="map_baru3.tmj");const i=e===5?10:20,r=this.generateRoomCode(),g=I.getStoredProfile(),b=g?g.id:null;let n=[...a.questions||[]];n.sort(()=>Math.random()-.5),n=n.slice(0,e);try{const{data:l,error:h}=await k.from(L).insert({game_pin:r,quiz_id:a.id,status:"waiting",question_limit:e,total_time_minutes:d/60,difficulty:s,host_id:b,created_at:new Date().toISOString(),current_questions:n}).select().single();if(h)throw console.error("Supabase Session Error:",h),new Error("Failed to create game session.");console.log("Session Created in Supabase B:",l);const p={roomCode:r,sessionId:l.id,difficulty:s,subject:a.category.toLowerCase(),quizId:a.id,quizTitle:a.title,questions:n,map:m,questionCount:e,enemyCount:i,timer:d,isHost:!0,hostId:b,quizDetail:{title:a.title,category:a.category,language:a.language||"id",description:a.description,creator_avatar:a.creator_avatar||null,creator_username:a.creator_username||"kizuko"}};localStorage.setItem("currentRoomOptions",JSON.stringify(p));const c=await t.create("game_room",p);return console.log("Room created via RoomService!",c),localStorage.setItem("currentRoomId",c.id),localStorage.setItem("currentSessionId",c.sessionId),localStorage.setItem("currentReconnectionToken",c.reconnectionToken),localStorage.setItem("supabaseSessionId",l.id),{room:c,options:p}}catch(l){throw console.error("RoomService Flow Error:",l),l}}static generateRoomCode(){return Math.floor(1e5+Math.random()*9e5).toString()}}class S{static getGlobalStyles(){return`
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
        `}static generateHTML(t){const o=[t[0],t[1],t[2]],s=t,e=i=>{const r=Math.floor(i/1e3);return`${r/60<1?"":Math.floor(r/60).toString()+":"}${(r%60).toString().padStart(2,"0")}s`},a=[o[1],o[0],o[2]].map(i=>{if(!i)return'<div class="w-[100px] md:w-[150px]"></div>';const r=i.rank,g=r===1,b=r===2;let n="#cd7f32",l="bg-orange-900/40",h="rgba(205,127,50,0.5)",p="military_tech",c="h-32",f="w-[100px] md:w-[140px]",x="w-20 h-20 md:w-28 md:h-28";g?(n="#ffcc00",l="bg-yellow-600/40",h="rgba(255,204,0,0.6)",p="emoji_events",c="h-48 md:h-56",f="w-[120px] md:w-[180px]",x="w-24 h-24 md:w-32 md:h-32"):b&&(n="#c0c0c0",l="bg-gray-600/40",h="rgba(192,192,192,0.5)",c="h-40 md:h-44");const y=i.hairId?["bowlhair","curlyhair","longhair","mophair","shorthair","spikeyhair"][i.hairId-1]:null;return`
                <div class="flex flex-col items-center relative z-20 group">


                    <div class="${x} podium-avatar rounded-full bg-black/80 border-4 shadow-[0_0_20px_${h}] flex items-center justify-center font-bold mb-4 relative backdrop-blur-sm group-hover:-translate-y-2 transition-transform duration-300" style="color: ${n}; border-color: ${n}">
                        <!-- Character Animation -->
                        <div class="char-anim" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${y?`<div class="char-anim" style="background-image: url('/assets/${y}_idle_strip9.png')"></div>`:""}
                        

                    </div>

                    <div class="text-white text-xs md:text-base mb-2 truncate max-w-[100px] md:max-w-[160px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center">${i.name}</div>

                    <div class="${f} ${c} rounded-t-2xl border-4 border-b-0 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md" style="border-color: ${n}; background: linear-gradient(to top, rgba(0,0,0,0.9), ${l}); box-shadow: inset 0 0 30px ${h}, 0 -5px 20px ${h}">
                        <div class="absolute inset-0 bg-[url('/assets/bg_pattern.png')] opacity-10 mix-blend-overlay"></div>
                        <div class="text-2xl md:text-5xl font-bold mb-2 drop-shadow-[0_0_10px_rgba(0,0,0,1)] relative z-10" style="color: ${n}">${i.score}</div>
                        <span class="material-symbols-outlined text-4xl md:text-6xl opacity-40 relative z-10" style="color: ${n}">${p}</span>
                    </div>
                </div>
            `}).join(""),m=s.map(i=>{const r=i.hairId?["bowlhair","curlyhair","longhair","mophair","shorthair","spikeyhair"][i.hairId-1]:null;return`
            <div class="grid grid-cols-[60px_1fr_100px_100px] md:grid-cols-[100px_1fr_150px_150px] p-4 text-white items-center border-b border-white/5 hover:bg-white/5 transition-colors group">
                <div class="text-center font-bold text-white/50 group-hover:text-primary transition-colors text-xs md:text-base">${i.rank}</div>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 border-2 border-white/10 flex items-center justify-center font-bold text-xs md:text-sm group-hover:border-primary transition-colors overflow-hidden relative podium-avatar">
                        <div class="char-anim-sm" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${r?`<div class="char-anim-sm" style="background-image: url('/assets/${r}_idle_strip9.png')"></div>`:""}
                    </div>
                    <div class="font-bold text-xs md:text-base truncate max-w-[120px] md:max-w-[300px]">${i.name}</div>
                </div>
                <div class="text-center text-primary font-bold text-sm md:text-lg drop-shadow-[0_0_5px_rgba(0,255,85,0.3)]">${i.score}</div>
                <div class="text-center flex border-white/10 items-center justify-center gap-1 text-white/50 text-xs md:text-sm">
                    <span class="material-symbols-outlined text-sm">timer</span>
                    ${e(i.duration)}
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
                        ${a}
                    </div>

                    <!-- Leaderboard Table Card -->
                    ${s.length>0?`
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
        `}}class E{constructor(){this.rankings=[],this.sessionId=null,this.isHost=!0}start(t){this.initializeClient(),u.ensureClosed();let o=t==null?void 0:t.rankings;if(!o||o.length===0){const s=localStorage.getItem("hostLeaderboardData");if(s)try{o=JSON.parse(s)}catch{}}else localStorage.setItem("hostLeaderboardData",JSON.stringify(o));if(this.rankings=o||[],this.rankings.sort((s,e)=>s.rank-e.rank),this.isHost=(t==null?void 0:t.isHost)!==void 0?t.isHost:!0,this.opts=t==null?void 0:t.lastGameOptions,this.opts)localStorage.setItem("hostLastGameOptions",JSON.stringify(this.opts));else{const s=localStorage.getItem("hostLastGameOptions");if(s)try{this.opts=JSON.parse(s)}catch{}}if(this.q=t==null?void 0:t.lastSelectedQuiz,this.q)localStorage.setItem("hostLastSelectedQuiz",JSON.stringify(this.q));else{const s=localStorage.getItem("hostLastSelectedQuiz");if(s)try{this.q=JSON.parse(s)}catch{}}this.sessionId=(t==null?void 0:t.mySessionId)||null,this.sessionId?this.sessionId&&localStorage.setItem("hostLastSessionId",this.sessionId):this.sessionId=localStorage.getItem("hostLastSessionId"),this.container=document.createElement("div"),this.container.id="leaderboard-ui",this.container.style.cssText='position:absolute; top:0; left:0; width:100%; height:100%; z-index:1000; font-family: "Retro Gaming", monospace !important;',document.body.appendChild(this.container),this.renderLeaderboard(),setTimeout(()=>u.open(),100)}initializeClient(){let o;if(!o){const s=window.location.protocol==="https:"?"wss":"ws";o=`${s}://${window.location.host}`,window.location.hostname==="localhost"&&(o=`${s}://localhost:2567`)}this.client=new $.Client(o)}renderLeaderboard(){const t="leaderboard-local-styles";if(!document.getElementById(t)){const o=document.createElement("style");o.id=t,o.innerHTML=S.getGlobalStyles(),document.head.appendChild(o)}w.navigate("/host/leaderboard"),this.container.innerHTML=S.generateHTML(this.rankings),this.attachListeners()}attachListeners(){const t=document.getElementById("lb-home-btn"),o=document.getElementById("lb-restart-btn"),s=document.getElementById("lb-stats-btn");s&&(s.onclick=()=>{var d,a,m,i,r;let e=((d=this.opts)==null?void 0:d.sessionId)||localStorage.getItem("supabaseSessionId");!e&&this.rankings.length>0&&(e=this.rankings[0].sessionId),e||(e=((m=(a=localStorage.getItem("lastGameOptions"))==null?void 0:a.match(/"sessionId":"([^"]+)"/))==null?void 0:m[1])||((r=(i=localStorage.getItem("hostLastGameOptions"))==null?void 0:i.match(/"sessionId":"([^"]+)"/))==null?void 0:r[1])),e&&e!=="undefined"&&e!=="null"?window.open(`https://gameforsmartnewui.vercel.app/stat/${e}`,"_blank"):alert("ID Sesi tidak ditemukan. Tidak dapat membuka statistik.")}),t&&(t.onclick=()=>{u.close(()=>{this.cleanup(),window.history.pushState({},"","/"),new _().init()})}),o&&(o.onclick=async()=>{if(this.opts&&!this.q&&this.opts.quizId)try{this.q=await z(()=>import("./QuizData-BeTiwLY1.js"),__vite__mapDeps([0,1])).then(e=>e.fetchQuizById(this.opts.quizId)),this.q&&localStorage.setItem("hostLastSelectedQuiz",JSON.stringify(this.q))}catch(e){console.error("Failed to fetch quiz for restart:",e)}this.opts&&this.q?u.close(async()=>{try{const{room:e,options:d}=await T.createRoom(this.client,{...this.opts,quiz:this.q});this.cleanup(),w.navigate(`/host/${d.roomCode}/lobby`),O("HostWaitingRoomScene",{room:e,isHost:!0}),setTimeout(()=>u.open(),600)}catch(e){console.error(e),alert("Restart error. Returning to lobby."),this.cleanup(),new _().init()}}):alert("Tidak dapat menemukan data kuis untuk mengulang permainan. Silakan kembali ke Lobby.")})}cleanup(){this.container&&(this.container.parentNode&&this.container.parentNode.removeChild(this.container),this.container.remove());const t=document.getElementById("leaderboard-local-styles");t&&(t.parentNode&&t.parentNode.removeChild(t),t.remove())}}export{E as HostLeaderboardManager};
