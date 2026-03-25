const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/page-BJwiwr8n.js","assets/index-BLa7V74t.js","assets/OrientationManager-Br2LilYK.js"])))=>i.map(i=>d[i]);
import{T as l,R as p,_ as c}from"./index-BLa7V74t.js";import{O as d}from"./OrientationManager-Br2LilYK.js";class u{constructor(){this.rankings=[],this.mySessionId="",this.spawnerInterval=null}start(e){if(l.ensureClosed(),d.requirePortrait(),this.room=e==null?void 0:e.room,this.rankings=(e==null?void 0:e.leaderboardData)||[],this.rankings.sort((t,s)=>t.rank-s.rank),this.mySessionId=(e==null?void 0:e.mySessionId)||(this.room?this.room.sessionId:""),this.container=document.createElement("div"),this.container.id="leaderboard-ui",this.container.style.cssText="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1000;",document.body.appendChild(this.container),!document.getElementById("leaderboard-styles")){const t=document.createElement("style");t.id="leaderboard-styles",t.innerHTML=this.getGlobalStyles(),document.head.appendChild(t)}this.renderLeaderboard(),this.room&&this.room.onMessage("gameEnded",t=>{this.rankings=t.rankings,this.rankings.sort((s,o)=>s.rank-o.rank),this.renderLeaderboard()}),setTimeout(()=>l.open(),100)}getGlobalStyles(){return`
            #leaderboard-ui {
                background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);
                color: white; display: flex; flex-direction: column; align-items: center;
                font-family: 'Retro Gaming', monospace; overflow-y: auto; height: 100vh; width: 100vw;
            }
            .pixel-bg-pattern { background-image: radial-gradient(#2d5a30 1px, transparent 1px); background-size: 24px 24px; }
            .firefly { position: absolute; width: 4px; height: 4px; background: #FEFF9F; border-radius: 50%; filter: blur(1px); animation: firefly-bounce 4s infinite ease-in-out; z-index: 1; }
            @keyframes firefly-bounce { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; } 50% { transform: translateY(-20px) scale(1.2); opacity: 1; } }
            @keyframes drift { from { transform: translateX(-100%) scale(var(--s)); } to { transform: translateX(100vw) scale(var(--s)); } }
            @keyframes drift-reverse { from { transform: translateX(100vw) scale(var(--s)); } to { transform: translateX(-100%) scale(var(--s)); } }
            .cloud { position: absolute; pointer-events: none; }
            @keyframes base-walk-cycle { from { background-position: 0 0; } to { background-position: -768px 0; } }
            @keyframes walk-across-right { from { left: -100px; } to { left: 100vw; } }
            @keyframes walk-across-left { from { left: 100vw; } to { left: -100px; } }
            .walking-char { position: absolute; bottom: 20px; width: 96px; height: 64px; background-image: url('/assets/base_walk_strip8.png'); background-size: 768px 64px; image-rendering: pixelated; z-index: 2; pointer-events: none; }
            .podium-section { display: flex; justify-content: center; align-items: flex-end; gap: 16px; margin-bottom: 40px; padding-top: 100px; position: relative; }
            .podium-column { display: flex; flex-direction: column; align-items: center; width: 140px; }
            .podium-column.rank-1 { order: 2; z-index: 10; width: 180px; }
            .podium-column.rank-2 { order: 1; }
            .podium-column.rank-3 { order: 3; }
            .podium-body { width: 100%; border-radius: 20px 20px 0 0; display: flex; flex-direction: column; align-items: center; padding: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            .rank-1 .podium-body { height: 260px; background: linear-gradient(180deg, #FFD700 0%, #B8860B 100%); }
            .rank-2 .podium-body { height: 230px; background: linear-gradient(180deg, #E0E0E0 0%, #808080 100%); }
            .rank-3 .podium-body { height: 230px; background: linear-gradient(180deg, #CD7F32 0%, #8B4513 100%); }
            .podium-name-text { background: rgba(0,0,0,0.6); padding: 6px 10px; border-radius: 6px; font-size: 8px; color: white; white-space: nowrap; margin-bottom: 10px; }
            .podium-avatar { width: 100%; height: 80px; position: relative; display: flex; justify-content: center; align-items: center; }
            .char-anim { width: 96px; height: 64px; image-rendering: pixelated; position: absolute; transform: scale(3.5); animation: lb-play-idle 1s steps(9) infinite; }
            @keyframes lb-play-idle { from { background-position: 0 0; } to { background-position: -864px 0; } }
            .podium-score { font-size: 16px; margin-top: auto; margin-bottom: 15px; padding: 6px 16px; border-radius: 10px; border: 2px solid #4A3000; background: rgba(255,255,255,0.1); }
            .list-section { width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 6px; padding-bottom: 80px; }
            .list-item { display: grid; grid-template-columns: 40px 1fr 100px 60px; background: rgba(255,255,255,0.03); padding: 10px 15px; border-radius: 10px; font-size: 11px; }
            .lb-footer {
                position: fixed;
                bottom: 40px;
                left: 0;
                width: 100%;
                display: flex;
                justify-content: center;
                gap: 40px;
                padding: 0 40px;
                pointer-events: none;
                z-index: 100;
            }
            .nav-btn {
                pointer-events: auto; background: #92C140; border-radius: 20px; width: 72px; height: 72px;
                display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;
                border: none; border-bottom: 6px solid #478D47; transition: all 0.2s ease;
                box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            }
            .nav-btn:hover { brightness: 1.1; transform: translateY(-2px); }
            .nav-btn:active { transform: translateY(4px); border-bottom-width: 2px; }
            .nav-btn .material-symbols-outlined { font-size: 30px; }
 Simon: Updated nav-btn to 3D green style.
            .logo-center {
                position: fixed;
                top: 25px;
                left: 0;
                right: 0;
                margin: 0 auto;
                width: 200px;
                z-index: 2000;
                pointer-events: none;
                filter: drop-shadow(0 0 10px rgba(114, 191, 120, 0.4));
                display: none;
            }

            .logo-left { 
                position: absolute; 
                top: -30px; 
                left: -40px; 
                width: 256px; 
                pointer-events: none; 
                z-index: 1000; 
            }
            .logo-right { 
                position: absolute; 
                top: -45px; 
                right: -15px; 
                width: 320px; 
                pointer-events: none; 
                z-index: 1000; 
            }

            @media (max-width: 768px) {
                .logo-left, .logo-right { display: none; }
                .logo-center { display: block; width: 160px; top: 15px; }
                .podium-section { padding-top: 70px; margin-bottom: 20px; gap: 8px; }
                .podium-column { width: 100px; }
                .podium-column.rank-1 { width: 120px; }
                .rank-1 .podium-body { height: 180px; }
                .rank-2 .podium-body, .rank-3 .podium-body { height: 150px; }
                .podium-avatar { height: 50px; }
                .char-anim { transform: scale(2); }
                .podium-score { font-size: 10px; padding: 4px 8px; }
                .podium-name-text { font-size: 6px; }
                
                .lb-footer {
                    bottom: 20px;
                    flex-direction: row;
                    gap: 10px;
                    padding: 0 15px;
                }
                .nav-btn-wide {
                    flex: 1; pointer-events: auto; height: 52px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    font-family: 'Retro Gaming', monospace; font-size: 10px; text-transform: uppercase;
                    border: none; cursor: pointer; transition: all 0.2s;
                    background: #92C140; color: white;
                    border-bottom: 4px solid #478D47;
                    box-shadow: 0 8px 0 #478D47;
                }
                .nav-btn-wide:active { transform: translateY(2px); border-bottom-width: 2px; box-shadow: 0 6px 0 #478D47; }
                .nav-btn { display: none; }
            }

            @media (min-width: 769px) {
                .nav-btn-wide { display: none; }
            }
        `}renderLeaderboard(){p.navigate("/player/leaderboard");const e=this.rankings.slice(0,3),t=this.rankings.slice(3),s=n=>{const i=Math.floor(n/1e3);return`${Math.floor(i/60).toString().padStart(2,"0")}:${(i%60).toString().padStart(2,"0")}`},o=[1,0,2].map(n=>{const i=e[n];if(!i)return'<div class="podium-column" style="opacity:0"></div>';const a=i.hairId?["bowlhair","curlyhair","longhair","mophair","shorthair","spikeyhair"][i.hairId-1]:null;return`
                <div class="podium-column rank-${i.rank}">
                    <div class="podium-body">
                        <span class="podium-name-text">${i.name}</span>
                        <div class="podium-avatar">
                            <div class="char-anim" style="background-image:url('/assets/base_idle_strip9.png')"></div>
                            ${a?`<div class="char-anim" style="background-image:url('/assets/${a}_idle_strip9.png')"></div>`:""}
                        </div>
                        <div class="podium-score">${i.score}</div>
                    </div>
                </div>
            `}).join("");this.container.innerHTML=`
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
                <!-- Fireflies -->
                <div class="firefly" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                <div class="firefly" style="top: 65%; left: 80%; animation-delay: 1.5s;"></div>
            </div>
            <!-- Walking Characters Container -->
            <div id="leaderboard-walking-characters-container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>

            <img src="/logo/Zigma-logo-fix.webp" class="logo-center" />
            <img src="/logo/Zigma-logo-fix.webp" class="logo-left" />
            <img src="/logo/gameforsmart-logo-fix.webp" class="logo-right" />
            <div class="podium-section" style="position:relative; z-index:10;">${o}</div>
            <div class="list-section" style="position:relative; z-index:10;">${t.map(n=>`
                <div class="list-item" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">
                    <span>#${n.rank}</span><span style="font-weight:bold;">${n.name}</span><span>${s(n.duration)}</span><span>${n.score}</span>
                </div>
            `).join("")}</div>
            <div class="lb-footer">
                <button id="lb-home-btn" class="nav-btn"><span class="material-symbols-outlined">home</span></button>
                <button id="lb-stats-btn" class="nav-btn"><span class="material-symbols-outlined">analytics</span></button>
                <button id="lb-back-btn" class="nav-btn"><span class="material-symbols-outlined">person</span></button>

                <button id="lb-home-btn-mobile" class="nav-btn-wide"><span class="material-symbols-outlined">home</span>HOME</button>
                <button id="lb-stats-btn-mobile" class="nav-btn-wide"><span class="material-symbols-outlined">analytics</span>STATISTICS</button>
                <button id="lb-back-btn-mobile" class="nav-btn-wide"><span class="material-symbols-outlined">person</span>RESULT</button>
            </div>
        `,this.startCharacterSpawner(),this.attachListeners()}attachListeners(){const e=document.getElementById("lb-home-btn"),t=document.getElementById("lb-back-btn"),s=document.getElementById("lb-stats-btn"),o=a=>{a&&(a.onclick=()=>l.transitionTo(()=>{this.cleanup(),this.room&&this.room.leave(),window.location.href="/"}))};o(e),o(document.getElementById("lb-home-btn-mobile"));const n=a=>{a&&(a.onclick=()=>l.transitionTo(()=>{this.cleanup(),c(()=>import("./page-BJwiwr8n.js"),__vite__mapDeps([0,1,2])).then(r=>{new r.ResultManager().start({room:this.room,leaderboardData:this.rankings})})}))};n(t),n(document.getElementById("lb-back-btn-mobile"));const i=a=>{a&&(a.onclick=()=>{let r=localStorage.getItem("supabaseSessionId");!r&&this.rankings.length>0&&(r=this.rankings[0].sessionId),r&&r!=="undefined"&&r!=="null"?window.open(`https://gameforsmartnewui.vercel.app/stat/${r}`,"_blank"):alert("ID Sesi tidak ditemukan. Tidak dapat membuka statistik.")})};i(s),i(document.getElementById("lb-stats-btn-mobile"))}cleanup(){this.spawnerInterval&&(clearInterval(this.spawnerInterval),this.spawnerInterval=null),this.container&&this.container.remove();const e=document.getElementById("leaderboard-styles");e&&e.remove(),d.disable()}startCharacterSpawner(){if(this.spawnerInterval)return;const e=document.getElementById("leaderboard-walking-characters-container");e&&(this.checkAndSpawn(e),this.spawnerInterval=setInterval(()=>this.checkAndSpawn(e),5e3))}checkAndSpawn(e){const t=e.querySelectorAll(".walking-char").length;t>=3||Math.random()<(t===0?.8:.4)&&this.spawnCharacter(e)}spawnCharacter(e){const t=document.createElement("div");t.className="walking-char";const s=Math.random()>.5,o=20+Math.random()*10;s?(t.style.animation=`base-walk-cycle 0.8s steps(8) infinite, walk-across-left ${o}s linear forwards`,t.style.transform="scale(-1.5, 1.5)"):(t.style.animation=`base-walk-cycle 0.8s steps(8) infinite, walk-across-right ${o}s linear forwards`,t.style.transform="scale(1.5, 1.5)"),e.appendChild(t),setTimeout(()=>{t.parentElement&&t.remove()},o*1e3+500)}}export{u as PlayerLeaderboardManager};
