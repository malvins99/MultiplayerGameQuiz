const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/QuizData-DjroFjlQ.js","assets/index-MceoIJHw.js"])))=>i.map(i=>d[i]);
import{a as k,s as L,S as $,G as u,i,T as f,l as B,R as _,_ as E,L as z}from"./index-MceoIJHw.js";import{initializeGame as T}from"./game-CwzDDZGL.js";import{O as I}from"./OrientationManager-Br2LilYK.js";import"./characterData-qCqug7LG.js";class C{static async createRoom(t,o){const{difficulty:e,questionCount:n,timer:b,quiz:a}=o;let p="map_newest_easy_nomor1.tmj";e==="sedang"&&(p="map_baru2.tmj"),e==="sulit"&&(p="map_baru3.tmj");const r=n===5?10:20,l=this.generateRoomCode(),s=k.getStoredProfile(),m=s?s.id:null;let d=[...a.questions||[]];d.sort(()=>Math.random()-.5),d=d.slice(0,n);try{const{data:c,error:g}=await L.from($).insert({game_pin:l,quiz_id:a.id,status:"waiting",question_limit:n,total_time_minutes:b/60,difficulty:e,host_id:m,created_at:new Date().toISOString(),current_questions:d}).select().single();if(g)throw console.error("Supabase Session Error:",g),new Error("Failed to create game session.");console.log("Session Created in Supabase B:",c);const h={roomCode:l,sessionId:c.id,difficulty:e,subject:a.category.toLowerCase(),quizId:a.id,quizTitle:a.title,questions:d,map:p,questionCount:n,enemyCount:r,timer:b,isHost:!0,hostId:m,quizDetail:{title:a.title,category:a.category,language:a.language||"id",description:a.description,creator_avatar:a.creator_avatar||null,creator_username:a.creator_username||"kizuko"}};localStorage.setItem("currentRoomOptions",JSON.stringify(h));const x=await t.create("game_room",h);return console.log("Room created via RoomService!",x),localStorage.setItem("currentRoomId",x.id),localStorage.setItem("currentSessionId",x.sessionId),localStorage.setItem("currentReconnectionToken",x.reconnectionToken),localStorage.setItem("supabaseSessionId",c.id),{room:x,options:h}}catch(c){throw console.error("RoomService Flow Error:",c),c}}static generateRoomCode(){return Math.floor(1e5+Math.random()*9e5).toString()}}class S{static getGlobalStyles(){return`
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
            .logo-center { position: fixed; top: 25px; left: 0; right: 0; margin: 0 auto; width: 200px; z-index: 2000; pointer-events: none; display: none; }
            .logo-left { position: absolute; top: -30px; left: -40px; width: 280px; z-index: 20; pointer-events: none; }
            .logo-right { position: absolute; top: -45px; right: -15px; width: 320px; z-index: 20; pointer-events: none; }
            .lb-footer-mobile { display: none; }
            .desktop-floating-actions { display: none; }
            .nav-btn {
                pointer-events: auto; background: #336B23; border: none; border-bottom: 4px solid #1F4514; border-radius: 12px;
                width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.2s;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            }
            .nav-btn:hover { filter: brightness(85%); }
            .nav-btn:active { transform: translateY(4px); border-bottom-width: 0; }
            .nav-btn .material-symbols-outlined { font-size: 30px; color: white; }
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
                    background: #336B23; color: white; border-bottom: 3px solid #1F4514; box-shadow: 0 6px 0 #1F4514;
                }
                .nav-btn-wide:hover { filter: brightness(85%); }
                .nav-btn-wide:active { transform: translateY(2px); border-bottom-width: 2px; box-shadow: 0 4px 0 #1F4514; }
                .nav-btn-wide .material-symbols-outlined { color: white; }
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
        `}static generateHTML(t){const o=[t[0],t[1],t[2]],e=t,n=r=>{const l=Math.floor(r/1e3),s=Math.floor(l/60),m=l%60;return`${s}:${m.toString().padStart(2,"0")}`},a=[o[1],o[0],o[2]].map(r=>{if(!r)return'<div class="w-[100px] md:w-[150px]"></div>';const l=r.rank,s=l===1,m=l===2;let d="#cd7f32",c="bg-orange-900/40",g="military_tech",h="h-32",x="w-[100px] md:w-[140px]",y="w-20 h-20 md:w-28 md:h-28";s?(d="#ffcc00",c="bg-yellow-600/40",g="emoji_events",h="h-48 md:h-56",x="w-[120px] md:w-[180px]",y="w-24 h-24 md:w-32 md:h-32"):m&&(d="#c0c0c0",c="bg-gray-600/40",h="h-40 md:h-44");const w=r.hairId?["bowlhair","curlyhair","longhair","mophair","shorthair","spikeyhair"][r.hairId-1]:null;return`
                <div class="flex flex-col items-center relative z-20 group">


                    <div class="${y} podium-avatar rounded-full border-4 flex items-center justify-center font-bold mb-4 relative" style="background-color: ${d}; border-color: ${d};">
                        <!-- Character Animation -->
                        <div class="char-anim" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${w?`<div class="char-anim" style="background-image: url('/assets/${w}_idle_strip9.png')"></div>`:""}
                        
                    </div>

                    <div class="text-sm md:text-2xl mb-3 font-bold text-center uppercase tracking-widest" style="color: #ffffff; font-family: 'Retro Gaming', monospace; letter-spacing: 2px; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000; -webkit-font-smoothing: none;">${r.name}</div>

                    <!-- The literal podium block (Hidden on mobile) -->
                    <div class="hidden md:flex ${x} ${h} rounded-t-2xl border-4 border-b-0 flex-col items-center justify-center relative overflow-hidden pointer-events-auto" style="border-color: ${d}; background: linear-gradient(to top, rgba(0,0,0,0.9), ${c});">
                        <div class="absolute inset-0 bg-[url('/assets/bg_pattern.png')] opacity-10"></div>
                        <div class="text-2xl md:text-5xl font-bold mb-2 relative z-10" style="font-family: 'Retro Gaming', monospace; color: #ffffff; text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000; -webkit-font-smoothing: none;">${r.score}</div>
                        <span class="material-symbols-outlined text-4xl md:text-6xl opacity-40 relative z-10" style="color: ${d}">${g}</span>
                    </div>
                </div>
            `}).join(""),p=e.map(r=>{const l=r.hairId?["bowlhair","curlyhair","longhair","mophair","shorthair","spikeyhair"][r.hairId-1]:null;return`
            <div class="grid grid-cols-[40px_1fr_60px_60px] md:grid-cols-[100px_1fr_150px_150px] p-4 text-gray-800 items-center border-b border-gray-200 hover:bg-gray-100 transition-colors group font-['Retro_Gaming']" style="-webkit-font-smoothing: none;">
                <div class="text-center font-bold text-gray-600 group-hover:text-[#336B23] transition-colors text-sm md:text-lg">${r.rank}</div>
                <div class="flex items-center gap-2 md:gap-3">
                    <div class="hidden md:flex w-10 h-10 rounded-full bg-[#e2e8f0]/95 border-2 border-gray-300 items-center justify-center font-bold text-sm group-hover:border-[#336B23] transition-colors overflow-hidden relative podium-avatar">
                        <div class="char-anim-sm" style="background-image: url('/assets/base_idle_strip9.png')"></div>
                        ${l?`<div class="char-anim-sm" style="background-image: url('/assets/${l}_idle_strip9.png')"></div>`:""}
                    </div>
                    <div class="font-bold text-xs md:text-lg truncate max-w-[150px] md:max-w-[300px] py-1 uppercase text-[#336B23]">${r.name}</div>
                </div>
                <div class="text-center text-[#478D47] font-bold text-sm md:text-xl">${r.score}</div>
                <div class="text-center text-gray-700 text-xs md:text-base font-bold">
                    ${n(r.duration)}
                </div>
            </div>
        `}).join("");return`
            <div translate="no" class="notranslate fixed inset-0 w-full h-screen overflow-hidden text-white pointer-events-auto select-none" style="background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);">
                
                ${u.getHTML("leaderboard")}

                <!-- Logos -->
                <img src="/logo/Zigma-logo-fix.webp" alt="Zigma Logo" class="logo-center" />
                <img src="/logo/Zigma-logo-fix.webp" alt="Zigma Logo" class="logo-left" />
                <img src="/logo/gameforsmart-logo-fix.webp" alt="GameForSmart Logo" class="logo-right" />

                <!-- MAIN CONTENT AREA: overflow-hidden for mobile to prevent scrollbars, auto for desktop -->
                <div class="relative z-10 w-full h-[100dvh] flex flex-col items-center pt-24 md:pt-28 pb-20 md:pb-12 px-4 overflow-hidden md:overflow-y-auto custom-scrollbar pointer-events-none">
                    


                    <!-- Podiums (Keep wrapper flex but adjust bottom margin for mobile) -->
                    <div class="flex items-end justify-center gap-2 md:gap-8 mb-4 md:mb-12 shrink-0">
                        ${a}
                    </div>

                    <!-- Leaderboard Table Card -->
                    ${e.length>0?`
                    <div class="w-full max-w-4xl bg-white border-[3px] border-[#336B23] rounded-3xl shadow-[0_0_30px_rgba(51,107,35,0.2)] overflow-hidden shrink-0 md:mb-20 flex flex-col flex-1 md:flex-none min-h-0 pointer-events-auto">
                        <!-- Header -->
                        <div class="bg-[#F1F8E9] border-b-[3px] border-[#336B23] relative shrink-0">
                            <div class="grid grid-cols-[40px_1fr_60px_60px] md:grid-cols-[100px_1fr_150px_150px] p-4 md:p-5 font-bold text-[#6CC452] uppercase tracking-widest text-sm md:text-lg font-['Retro_Gaming']" style="text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;">
                                <div id="hdr-lb-rank" class="text-center">${i.t("host_leaderboard.rank")}</div>
                                <div id="hdr-lb-player">${i.t("host_leaderboard.player")}</div>
                                <div id="hdr-lb-score" class="text-center">${i.t("host_leaderboard.score")}</div>
                                <div id="hdr-lb-time" class="text-center">${i.t("host_leaderboard.time")}</div>
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
                    <button id="lb-home-btn" class="nav-btn" title="${i.t("host_leaderboard.title_home")}">
                        <span class="material-symbols-outlined">home</span>
                    </button>
                    <button id="lb-restart-btn" class="nav-btn" title="${i.t("host_leaderboard.title_restart")}">
                        <span class="material-symbols-outlined">restart_alt</span>
                    </button>
                </div>

                <div class="desktop-floating-actions fixed top-[40%] md:top-1/2 right-4 md:right-6 -translate-y-1/2 flex-col gap-4 z-50">
                    <button id="lb-stats-btn" class="nav-btn" title="${i.t("host_leaderboard.title_stats")}">
                        <span class="material-symbols-outlined">analytics</span>
                    </button>
                </div>

                <!-- MOBILE FOOTER ACTIONS -->
                <div class="lb-footer-mobile">
                    <button id="lb-home-btn-mobile" class="nav-btn-wide">
                        <span class="material-symbols-outlined text-[14px]">home</span><span id="txt-lb-home">${i.t("host_leaderboard.home")}</span>
                    </button>
                    <button id="lb-restart-btn-mobile" class="nav-btn-wide">
                        <span class="material-symbols-outlined text-[14px]">restart_alt</span><span id="txt-lb-restart">${i.t("host_leaderboard.restart")}</span>
                    </button>
                    <button id="lb-stats-btn-mobile" class="nav-btn-wide">
                        <span class="material-symbols-outlined text-[14px]">analytics</span><span id="txt-lb-stats">${i.t("host_leaderboard.stats")}</span>
                    </button>
                </div>
            </div>
        `}}class M{constructor(){this.rankings=[],this.sessionId=null,this.isHost=!0,this.handleLangChange=()=>{const t=document.getElementById("hdr-lb-rank");t&&(t.innerText=i.t("host_leaderboard.rank"));const o=document.getElementById("hdr-lb-player");o&&(o.innerText=i.t("host_leaderboard.player"));const e=document.getElementById("hdr-lb-score");e&&(e.innerText=i.t("host_leaderboard.score"));const n=document.getElementById("hdr-lb-time");n&&(n.innerText=i.t("host_leaderboard.time"));const b=document.getElementById("lb-home-btn");b&&(b.title=i.t("host_leaderboard.title_home"));const a=document.getElementById("lb-restart-btn");a&&(a.title=i.t("host_leaderboard.title_restart"));const p=document.getElementById("lb-stats-btn");p&&(p.title=i.t("host_leaderboard.title_stats"));const r=document.getElementById("txt-lb-home");r&&(r.innerText=i.t("host_leaderboard.home"));const l=document.getElementById("txt-lb-restart");l&&(l.innerText=i.t("host_leaderboard.restart"));const s=document.getElementById("txt-lb-stats");s&&(s.innerText=i.t("host_leaderboard.stats"))}}start(t){this.initializeClient(),f.ensureClosed(),I.requirePortrait(i.t("host_leaderboard.portrait_req_title"),i.t("host_leaderboard.portrait_req_desc")),window.addEventListener("languageChanged",this.handleLangChange);let o=t==null?void 0:t.rankings;if(!o||o.length===0){const e=localStorage.getItem("hostLeaderboardData");if(e)try{o=JSON.parse(e)}catch{}}else localStorage.setItem("hostLeaderboardData",JSON.stringify(o));if(this.rankings=o||[],this.rankings.sort((e,n)=>e.rank-n.rank),this.isHost=(t==null?void 0:t.isHost)!==void 0?t.isHost:!0,this.opts=t==null?void 0:t.lastGameOptions,this.opts)localStorage.setItem("hostLastGameOptions",JSON.stringify(this.opts));else{const e=localStorage.getItem("hostLastGameOptions");if(e)try{this.opts=JSON.parse(e)}catch{}}if(this.q=t==null?void 0:t.lastSelectedQuiz,this.q)localStorage.setItem("hostLastSelectedQuiz",JSON.stringify(this.q));else{const e=localStorage.getItem("hostLastSelectedQuiz");if(e)try{this.q=JSON.parse(e)}catch{}}this.sessionId=(t==null?void 0:t.mySessionId)||null,this.sessionId?this.sessionId&&localStorage.setItem("hostLastSessionId",this.sessionId):this.sessionId=localStorage.getItem("hostLastSessionId"),this.container=document.createElement("div"),this.container.id="leaderboard-ui",this.container.style.cssText='position:absolute; top:0; left:0; width:100%; height:100%; z-index:1000; font-family: "Retro Gaming", monospace !important;',document.body.appendChild(this.container),this.renderLeaderboard(),setTimeout(()=>f.open(),100)}initializeClient(){let o;if(!o){const e=window.location.protocol==="https:"?"wss":"ws";o=`${e}://${window.location.host}`,window.location.hostname==="localhost"&&(o=`${e}://localhost:2567`)}this.client=new B.Client(o)}renderLeaderboard(){const t="leaderboard-local-styles";if(!document.getElementById(t)){const o=document.createElement("style");o.id=t,o.innerHTML=S.getGlobalStyles(),document.head.appendChild(o)}_.navigate("/host/leaderboard"),this.container.innerHTML=S.generateHTML(this.rankings),u.startCharacterSpawner("leaderboard"),this.attachListeners()}attachListeners(){const t=document.getElementById("lb-home-btn"),o=document.getElementById("lb-restart-btn"),e=document.getElementById("lb-stats-btn"),n=document.getElementById("lb-home-btn-mobile"),b=document.getElementById("lb-restart-btn-mobile"),a=document.getElementById("lb-stats-btn-mobile"),p=()=>{var m,d,c,g,h;let s=((m=this.opts)==null?void 0:m.sessionId)||localStorage.getItem("supabaseSessionId");!s&&this.rankings.length>0&&(s=this.rankings[0].sessionId),s||(s=((c=(d=localStorage.getItem("lastGameOptions"))==null?void 0:d.match(/"sessionId":"([^"]+)"/))==null?void 0:c[1])||((h=(g=localStorage.getItem("hostLastGameOptions"))==null?void 0:g.match(/"sessionId":"([^"]+)"/))==null?void 0:h[1])),s&&s!=="undefined"&&s!=="null"?window.open(`https://gameforsmartnewui.vercel.app/stat/${s}`,"_blank"):alert(i.t("host_leaderboard.no_session_id"))};e&&(e.onclick=p),a&&(a.onclick=p);const r=()=>{f.transitionTo(()=>{this.cleanup(),window.location.href="/"})};t&&(t.onclick=r),n&&(n.onclick=r);const l=async()=>{if(this.opts&&!this.q&&this.opts.quizId)try{this.q=await E(()=>import("./QuizData-DjroFjlQ.js"),__vite__mapDeps([0,1])).then(s=>s.fetchQuizById(this.opts.quizId)),this.q&&localStorage.setItem("hostLastSelectedQuiz",JSON.stringify(this.q))}catch(s){console.error("Failed to fetch quiz for restart:",s)}this.opts&&this.q?f.close(async()=>{try{const{room:s,options:m}=await C.createRoom(this.client,{...this.opts,quiz:this.q});this.cleanup(),_.navigate(`/host/${m.roomCode}/lobby`),T("HostWaitingRoomScene",{room:s,isHost:!0}),setTimeout(()=>f.open(),600)}catch(s){console.error(s),alert(i.t("host_leaderboard.restart_error")),this.cleanup(),new z().init()}}):alert(i.t("host_leaderboard.no_quiz_data"))};o&&(o.onclick=l),b&&(b.onclick=l)}cleanup(){u.stopCharacterSpawner("leaderboard"),this.container&&(this.container.parentNode&&this.container.parentNode.removeChild(this.container),this.container.remove());const t=document.getElementById("leaderboard-local-styles");t&&(t.parentNode&&t.parentNode.removeChild(t),t.remove()),I.disable(),window.removeEventListener("languageChanged",this.handleLangChange)}}export{M as HostLeaderboardManager};
