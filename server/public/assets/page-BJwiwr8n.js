import{T as r,R as d}from"./index-BLa7V74t.js";import{O as l}from"./OrientationManager-Br2LilYK.js";class h{constructor(){this.rankings=[],this.mySessionId="",this.roomId="",this.supabaseSessionId="",this.spawnerInterval=null}start(t){r.ensureClosed(),l.requirePortrait();let e=(t==null?void 0:t.leaderboardData)||[];this.room=t==null?void 0:t.room;let s=this.room?this.room.sessionId:"",i=this.room?this.room.id:"";if(this.supabaseSessionId=localStorage.getItem("supabaseSessionId")||"",e.length>0&&s&&i)this.rankings=e,this.mySessionId=s,this.roomId=i,sessionStorage.setItem("playerResultState",JSON.stringify({rankings:this.rankings,mySessionId:this.mySessionId,roomId:this.roomId,supabaseSessionId:this.supabaseSessionId}));else{const a=sessionStorage.getItem("playerResultState");if(a){const o=JSON.parse(a);this.rankings=o.rankings,this.mySessionId=o.mySessionId,this.roomId=o.roomId,o.supabaseSessionId&&(this.supabaseSessionId=o.supabaseSessionId)}}const n=document.getElementById("result-ui");if(n&&n.remove(),this.container=document.createElement("div"),this.container.id="result-ui",this.container.style.position="absolute",this.container.style.top="0",this.container.style.left="0",this.container.style.width="100%",this.container.style.height="100%",this.container.style.zIndex="1000",document.body.appendChild(this.container),!document.getElementById("result-styles")){const a=document.createElement("style");a.id="result-styles",a.innerHTML=this.getStyles(),document.head.appendChild(a)}this.renderIndividualResult(),this.room&&this.room.onMessage("gameEnded",a=>{this.rankings=a.rankings,sessionStorage.setItem("playerResultState",JSON.stringify({rankings:this.rankings,mySessionId:this.mySessionId,roomId:this.roomId,supabaseSessionId:this.supabaseSessionId})),this.renderIndividualResult()}),setTimeout(()=>{r.open()},100)}getStyles(){return`
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

            #result-ui {
                background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);
                color: white;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: 'Retro Gaming', monospace;
                overflow: hidden;
                height: 100vh;
                width: 100vw;
            }

            .pixel-bg-pattern {
                background-image: radial-gradient(#2d5a30 1px, transparent 1px);
                background-size: 24px 24px;
            }
            .firefly {
                position: absolute;
                width: 4px; height: 4px;
                background: #FEFF9F;
                border-radius: 50%;
                filter: blur(1px);
                animation: firefly-bounce 4s infinite ease-in-out;
                z-index: 1;
            }
            @keyframes firefly-bounce {
                0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
                50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
            }
            @keyframes drift {
                from { transform: translateX(-100%) scale(var(--s)); }
                to { transform: translateX(100vw) scale(var(--s)); }
            }
            @keyframes drift-reverse {
                from { transform: translateX(100vw) scale(var(--s)); }
                to { transform: translateX(-100%) scale(var(--s)); }
            }
            .cloud { position: absolute; pointer-events: none; }

            .result-card {
                background: white;
                border: 4px solid #6CC452;
                border-bottom: 10px solid #478D47;
                border-radius: 28px;
                padding: 40px;
                display: flex; flex-direction: column; align-items: center;
                min-width: 480px;
                position: relative;
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                z-index: 10;
            }

            .result-avatar-container {
                width: 180px; height: 180px;
                background: #F1F8E9;
                border: 2px solid #478D47;
                border-radius: 24px;
                display: flex; align-items: center; justify-content: center;
                margin-bottom: 25px;
                position: relative; overflow: visible;
            }

            .char-anim { width: 96px; height: 64px; image-rendering: pixelated; position: absolute; transform: scale(4.5); }
            .anim-play { animation: lb-play-idle 1s steps(9) infinite; background-repeat: no-repeat; }
            @keyframes lb-play-idle { from { background-position: 0 0; } to { background-position: -864px 0; } }
            .result-char { transform: scale(8); }

            .result-name {
                font-family: 'Retro Gaming', monospace;
                font-size: 26px; color: #478D47;
                text-transform: uppercase; letter-spacing: 2px;
                margin-bottom: 40px;
            }

            .result-stats-row {
                display: flex; gap: 15px; width: 100%; justify-content: center;
            }

            .stat-box {
                background: #F1F8E9;
                border: 2px solid #6CC452;
                border-radius: 16px;
                padding: 20px 10px;
                width: 120px;
                display: flex; flex-direction: column; align-items: center;
                transition: transform 0.2s;
            }
            .stat-box:hover { transform: translateY(-5px); }
            .stat-icon { font-size: 28px; margin-bottom: 12px; color: #478D47; }
            .stat-value { font-family: 'Retro Gaming', monospace; font-size: 18px; color: #478D47; margin-bottom: 6px; }
            .stat-label { font-size: 9px; color: #6CC452; text-transform: uppercase; letter-spacing: 1px; }

            .lb-footer { 
                position: fixed; 
                top: 50%; 
                left: 0; 
                width: 100%; 
                display: flex; 
                justify-content: space-between; 
                padding: 0 40px; 
                pointer-events: none; 
                transform: translateY(-50%); 
                z-index: 20; 
            }
            .nav-btn {
                pointer-events: auto; 
                background: #92C140; 
                border: none;
                border-bottom: 4px solid #386938;
                border-radius: 12px; 
                width: 72px; height: 72px;
                display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.2s;
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
            }
            .nav-btn:hover { filter: brightness(110%); }
            .nav-btn:active { transform: translateY(4px); border-bottom-width: 0; }
            .nav-btn .material-symbols-outlined { font-size: 30px; }
 Simon: Darkened border-bottom to #386938.

            @keyframes base-walk-cycle { from { background-position: 0 0; } to { background-position: -768px 0; } }
            @keyframes walk-across-right { from { transform: translate3d(-100px, 0, 0) scale(1.5, 1.5); } to { transform: translate3d(100vw, 0, 0) scale(1.5, 1.5); } }
            @keyframes walk-across-left { from { transform: translate3d(100vw, 0, 0) scale(-1.5, 1.5); } to { transform: translate3d(-100px, 0, 0) scale(-1.5, 1.5); } }
            .walking-char {
                position: absolute;
                bottom: 20px;
                left: 0;
                width: 96px; height: 64px;
                background-image: url('/assets/base_walk_strip8.png');
                background-size: 768px 64px;
                image-rendering: pixelated;
                z-index: 2;
                pointer-events: none;
                will-change: transform;
            }

            .logo-center {
                position: fixed;
                top: 25px;
                left: 0;
                right: 0;
                margin: 0 auto;
                width: 200px;
                z-index: 2000;
                pointer-events: none;
                display: none; /* Hide by default, show on mobile */
            }

            .logo-left { 
                position: absolute; 
                top: -30px; 
                left: -40px; 
                width: 280px; 
                z-index: 20; 
                pointer-events: none;
            }
            .logo-right { 
                position: absolute; 
                top: -45px; 
                right: -15px; 
                width: 320px; 
                z-index: 20; 
                pointer-events: none;
            }

            @media (max-width: 768px) {
                .logo-left, .logo-right { display: none; }
                .logo-center { display: block; width: 280px; top: -10px; }
                .result-card { 
                    min-width: 90vw; 
                    padding: 25px 20px;
                    margin-top: 50px;
                    margin-bottom: 20px;
                    background: white;
                    border: 4px solid #6CC452;
                    border-bottom: 10px solid #478D47;
                }
                .result-avatar-container { width: 140px; height: 140px; background: #F1F8E9; border-color: #478D47; }
                .result-name { font-size: 20px; margin-bottom: 30px; color: #478D47; }
                .result-stats-row { 
                    gap: 6px; 
                    width: 100%;
                    justify-content: center;
                }
                .stat-box { 
                    padding: 10px 4px; 
                    flex: 1;
                    min-width: 0; /* Allow shrinking */
                    max-width: 85px; 
                    background: #F1F8E9;
                    border-color: #6CC452;
                }
                .stat-box .material-symbols-outlined { font-size: 22px; margin-bottom: 6px; color: #478D47; }
                .stat-value { font-size: 14px; margin-bottom: 2px; color: #478D47; }
                .stat-label { font-size: 8px; color: #6CC452; }
                .lb-footer {
                    top: auto;
                    bottom: 40px;
                    transform: none;
                    flex-direction: row;
                    gap: 15px;
                    padding: 0 20px;
                }
                .nav-btn-wide {
                    flex: 1;
                    pointer-events: auto;
                    height: 56px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    font-family: 'Retro Gaming', monospace;
                    font-size: 14px;
                    text-transform: uppercase;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: #92C140; 
                    color: white;
                    border-bottom: 4px solid #386938;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                }
                .nav-btn-wide:hover { filter: brightness(110%); }
                .nav-btn-wide:active { transform: translateY(4px); border-bottom-width: 0; }
                .nav-btn { display: none; }
 Simon: Darkened border-bottom to #386938 for mobile.
            }

            @media (min-width: 769px) {
                .nav-btn-wide { display: none; }
            }
        `}renderIndividualResult(){d.navigate("/player/result"),this.container.innerHTML="";const t=this.rankings.find(i=>i.sessionId===this.mySessionId)||this.rankings[0];if(!t)return;const e=i=>{const n=Math.floor(i/1e3),a=Math.floor(n/60),o=n%60;return`${a.toString().padStart(2,"0")}:${o.toString().padStart(2,"0")}`},s=this.getCharacterVisuals(t);this.container.innerHTML=`
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
            </div>

            <!-- Walking Characters Container -->
            <div id="result-walking-characters-container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>

            <img src="/logo/Zigma-logo-fix.webp" class="logo-center" />
            <img src="/logo/Zigma-logo-fix.webp" class="logo-left" />
            <img src="/logo/gameforsmart-logo-fix.webp" class="logo-right" />

            <div class="result-card">
                <div class="result-avatar-container">
                    <div class="char-anim result-char anim-play" style="${s.base}"></div>
                    ${s.hair?`<div class="char-anim result-char anim-play" style="${s.hair}"></div>`:""}
                </div>
                <div class="result-name">${t.name}</div>
                
                <div class="result-stats-row">
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">military_tech</span>
                        <div class="stat-value">${t.rank===-1?"#?":"#"+t.rank}</div>
                        <div class="stat-label">RANK</div>
                    </div>
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">workspace_premium</span>
                        <div class="stat-value">${t.score}</div>
                        <div class="stat-label">SCORE</div>
                    </div>
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">task_alt</span>
                        <div class="stat-value">${t.correctAnswers}/5</div>
                        <div class="stat-label">CORRECT</div>
                    </div>
                    <div class="stat-box">
                        <span class="material-symbols-outlined stat-icon">schedule</span>
                        <div class="stat-value">${e(t.duration)}</div>
                        <div class="stat-label">TIME</div>
                    </div>
                </div>
            </div>

            <div class="lb-footer">
                <button id="lb-home-btn" class="nav-btn btn-left">
                    <span class="material-symbols-outlined">home</span>
                </button>
                
                <button id="lb-home-btn-mobile" class="nav-btn-wide">
                    <span class="material-symbols-outlined">home</span>
                    HOME
                </button>
                
                <button id="lb-stats-btn-mobile" class="nav-btn-wide">
                    <span class="material-symbols-outlined">analytics</span>
                    STATISTICS
                </button>

                <button id="lb-stats-btn" class="nav-btn btn-right">
                    <span class="material-symbols-outlined">analytics</span>
                </button>
            </div>
        `,this.startCharacterSpawner(),this.attachListeners()}getCharacterVisuals(t){const e="background-image: url('/assets/base_idle_strip9.png'); background-size: 864px 64px;";let s="";if(t.hairId&&t.hairId>0){const n={1:"bowlhair",2:"curlyhair",3:"longhair",4:"mophair",5:"shorthair",6:"spikeyhair"}[t.hairId];n&&(s=`background-image: url('/assets/${n}_idle_strip9.png'); background-size: 864px 64px;`)}return{base:e,hair:s}}attachListeners(){setTimeout(()=>{const t=document.getElementById("lb-home-btn"),e=document.getElementById("lb-stats-btn");t&&(t.onclick=()=>{r.transitionTo(()=>{this.cleanup(),this.room&&this.room.leave(),window.location.href="/"})});const s=document.getElementById("lb-home-btn-mobile");s&&(s.onclick=()=>{r.transitionTo(()=>{this.cleanup(),this.room&&this.room.leave(),window.location.href="/"})}),e&&(e.onclick=()=>this.openStats());const i=document.getElementById("lb-stats-btn-mobile");i&&(i.onclick=()=>this.openStats())},50)}openStats(){const t=this.supabaseSessionId||localStorage.getItem("supabaseSessionId");t?window.open(`https://gameforsmartnewui.vercel.app/stat/${t}`,"_blank"):alert("ID Sesi tidak ditemukan.")}cleanup(){this.spawnerInterval&&(clearInterval(this.spawnerInterval),this.spawnerInterval=null),this.container&&this.container.remove();const t=document.getElementById("result-styles");t&&t.remove(),l.disable()}startCharacterSpawner(){if(this.spawnerInterval)return;const t=document.getElementById("result-walking-characters-container");t&&(this.checkAndSpawn(t),this.spawnerInterval=setInterval(()=>this.checkAndSpawn(t),5e3))}checkAndSpawn(t){const e=t.querySelectorAll(".walking-char").length;e>=3||Math.random()<(e===0?.8:.4)&&this.spawnCharacter(t)}spawnCharacter(t){const e=document.createElement("div");e.className="walking-char";const s=Math.random()>.5,i=20+Math.random()*10;s?e.style.animation=`base-walk-cycle 0.8s steps(8) infinite, walk-across-left ${i}s linear forwards`:e.style.animation=`base-walk-cycle 0.8s steps(8) infinite, walk-across-right ${i}s linear forwards`,t.appendChild(e),setTimeout(()=>{e.parentElement&&e.remove()},i*1e3+500)}}export{h as ResultManager};
