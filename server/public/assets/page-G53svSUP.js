import{T as r,R as l}from"./index-3vZSclUO.js";class p{constructor(){this.rankings=[],this.mySessionId="",this.roomId="",this.supabaseSessionId=""}start(t){r.ensureClosed();let i=(t==null?void 0:t.leaderboardData)||[];this.room=t==null?void 0:t.room;let s=this.room?this.room.sessionId:"",o=this.room?this.room.id:"";if(this.supabaseSessionId=localStorage.getItem("supabaseSessionId")||"",i.length>0&&s&&o)this.rankings=i,this.mySessionId=s,this.roomId=o,sessionStorage.setItem("playerResultState",JSON.stringify({rankings:this.rankings,mySessionId:this.mySessionId,roomId:this.roomId,supabaseSessionId:this.supabaseSessionId}));else{const e=sessionStorage.getItem("playerResultState");if(e){const n=JSON.parse(e);this.rankings=n.rankings,this.mySessionId=n.mySessionId,this.roomId=n.roomId,n.supabaseSessionId&&(this.supabaseSessionId=n.supabaseSessionId)}}const a=document.getElementById("result-ui");if(a&&a.remove(),this.container=document.createElement("div"),this.container.id="result-ui",this.container.style.position="absolute",this.container.style.top="0",this.container.style.left="0",this.container.style.width="100%",this.container.style.height="100%",this.container.style.zIndex="1000",document.body.appendChild(this.container),!document.getElementById("result-styles")){const e=document.createElement("style");e.id="result-styles",e.innerHTML=this.getStyles(),document.head.appendChild(e)}this.renderIndividualResult(),this.room&&this.room.onMessage("gameEnded",e=>{this.rankings=e.rankings,sessionStorage.setItem("playerResultState",JSON.stringify({rankings:this.rankings,mySessionId:this.mySessionId,roomId:this.roomId,supabaseSessionId:this.supabaseSessionId})),this.renderIndividualResult()}),setTimeout(()=>{r.open()},100)}getStyles(){return`
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

            #result-ui {
                background: #151515;
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

            .result-card {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px;
                display: flex; flex-direction: column; align-items: center;
                min-width: 480px;
                backdrop-filter: blur(10px);
                position: relative;
                box-shadow: 0 0 100px rgba(255, 255, 255, 0.03);
                z-index: 10;
            }

            .result-avatar-container {
                width: 180px; height: 180px;
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
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
                font-size: 26px; color: #fff;
                text-transform: uppercase; letter-spacing: 2px;
                margin-bottom: 40px;
            }

            .result-stats-row {
                display: flex; gap: 15px; width: 100%; justify-content: center;
            }

            .stat-box {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 20px 10px;
                width: 120px;
                display: flex; flex-direction: column; align-items: center;
                transition: background 0.2s, border-color 0.2s;
            }

            .stat-box:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.2); }
            .stat-icon { font-size: 28px; margin-bottom: 12px; color: #aaa; }
            .stat-value { font-family: 'Retro Gaming', monospace; font-size: 18px; color: #fff; margin-bottom: 6px; }
            .stat-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 1px; }

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
                pointer-events: auto; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 64px; height: 64px;
                display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; transition: all 0.3s;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            }
            .nav-btn:hover { border-color: rgba(255,255,255,0.4); background: rgba(255, 255, 255, 0.1); transform: scale(1.1); }
            .btn-left { left: 40px; } .btn-right { right: 40px; }
            .nav-btn .material-symbols-outlined { font-size: 28px; }

            .spotlight-container { 
                position: absolute; 
                top: 0; left: 50%; 
                transform: translateX(-50%); 
                width: 100vw; height: 100vh; 
                pointer-events: none; 
                z-index: 1; 
                overflow: hidden;
            }
            .spotlight-beam { 
                width: 200%; height: 200%; 
                position: absolute;
                top: -50%; left: -50%;
                background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 60%); 
                filter: blur(60px); 
                animation: flicker 4s infinite alternate; 
            }
            .spotlight-center {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 600px; height: 600px;
                background: radial-gradient(circle, rgba(0, 255, 136, 0.1) 0%, transparent 70%);
                filter: blur(40px);
                z-index: 2;
            }
            @keyframes flicker { 0%{opacity:0.8} 100%{opacity:1} }

            .logo-left { position: absolute; top: -60px; left: -65px; width: 384px; z-index: 20; object-fit: contain; filter: drop-shadow(0 0 15px rgba(255,255,255,0.2)); pointer-events: none; }
            .logo-right { position: absolute; top: 8px; right: 8px; width: 256px; z-index: 20; object-fit: contain; filter: drop-shadow(0 0 15px rgba(0,255,136,0.3)); pointer-events: none; }
        `}renderIndividualResult(){l.navigate("/player/result"),this.container.innerHTML="";const t=this.rankings.find(o=>o.sessionId===this.mySessionId)||this.rankings[0];if(!t)return;const i=o=>{const a=Math.floor(o/1e3),e=Math.floor(a/60),n=a%60;return`${e.toString().padStart(2,"0")}:${n.toString().padStart(2,"0")}`},s=this.getCharacterVisuals(t);this.container.innerHTML=`
            <div class="spotlight-container">
                <div class="spotlight-beam"></div>
                <div class="spotlight-center"></div>
            </div>
            <img src="/logo/Zigma-logo.webp" class="logo-left" />
            <img src="/logo/gameforsmart.webp" class="logo-right" />

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
                        <div class="stat-value">${i(t.duration)}</div>
                        <div class="stat-label">TIME</div>
                    </div>
                </div>
            </div>

            <div class="lb-footer">
                <button id="lb-home-btn" class="nav-btn btn-left">
                    <span class="material-symbols-outlined">home</span>
                </button>
                <button id="lb-stats-btn" class="nav-btn btn-right">
                    <span class="material-symbols-outlined">analytics</span>
                </button>
            </div>
        `,this.attachListeners()}getCharacterVisuals(t){const i="background-image: url('/assets/base_idle_strip9.png'); background-size: 864px 64px;";let s="";if(t.hairId&&t.hairId>0){const a={1:"bowlhair",2:"curlyhair",3:"longhair",4:"mophair",5:"shorthair",6:"spikeyhair"}[t.hairId];a&&(s=`background-image: url('/assets/${a}_idle_strip9.png'); background-size: 864px 64px;`)}return{base:i,hair:s}}attachListeners(){setTimeout(()=>{const t=document.getElementById("lb-home-btn"),i=document.getElementById("lb-stats-btn");t&&(t.onclick=()=>{r.transitionTo(()=>{this.cleanup(),this.room&&this.room.leave(),window.location.href="/"})}),i&&(i.onclick=()=>{const s=this.supabaseSessionId||localStorage.getItem("supabaseSessionId");s?window.open(`https://gameforsmartnewui.vercel.app/stat/${s}`,"_blank"):alert("ID Sesi tidak ditemukan.")})},50)}cleanup(){this.container&&this.container.remove();const t=document.getElementById("result-styles");t&&t.remove()}}export{p as ResultManager};
