const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/page-G53svSUP.js","assets/index-3vZSclUO.js"])))=>i.map(i=>d[i]);
import{T as a,R as d,_ as l}from"./index-3vZSclUO.js";class m{constructor(){this.rankings=[],this.mySessionId=""}start(e){if(a.ensureClosed(),this.room=e==null?void 0:e.room,this.rankings=(e==null?void 0:e.leaderboardData)||[],this.rankings.sort((i,n)=>i.rank-n.rank),this.mySessionId=(e==null?void 0:e.mySessionId)||(this.room?this.room.sessionId:""),this.container=document.createElement("div"),this.container.id="leaderboard-ui",this.container.style.cssText="position:absolute; top:0; left:0; width:100%; height:100%; z-index:1000;",document.body.appendChild(this.container),!document.getElementById("leaderboard-styles")){const i=document.createElement("style");i.id="leaderboard-styles",i.innerHTML=this.getGlobalStyles(),document.head.appendChild(i)}this.renderLeaderboard(),this.room&&this.room.onMessage("gameEnded",i=>{this.rankings=i.rankings,this.rankings.sort((n,s)=>n.rank-s.rank),this.renderLeaderboard()}),setTimeout(()=>a.open(),100)}getGlobalStyles(){return`
            #leaderboard-ui {
                background: #151515; color: white; display: flex; flex-direction: column; align-items: center;
                font-family: 'Retro Gaming', monospace; overflow-y: auto; height: 100vh; width: 100vw;
            }
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
                pointer-events: auto;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                width: 72px;
                height: 72px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.2s ease;
                backdrop-filter: blur(5px);
            }
            .nav-btn:hover { background: rgba(255, 255, 255, 0.2); transform: scale(1.1); }
            .logo-left { position: absolute; top: -30px; left: -40px; width: 256px; pointer-events: none; z-index: 1000; }
            .logo-right { position: absolute; top: -45px; right: -15px; width: 320px; pointer-events: none; z-index: 1000; }
        `}renderLeaderboard(){d.navigate("/player/leaderboard");const e=this.rankings.slice(0,3),i=this.rankings.slice(3),n=t=>{const o=Math.floor(t/1e3);return`${Math.floor(o/60).toString().padStart(2,"0")}:${(o%60).toString().padStart(2,"0")}`},s=[1,0,2].map(t=>{const o=e[t];if(!o)return'<div class="podium-column" style="opacity:0"></div>';const r=o.hairId?["bowlhair","curlyhair","longhair","mophair","shorthair","spikeyhair"][o.hairId-1]:null;return`
                <div class="podium-column rank-${o.rank}">
                    <div class="podium-body">
                        <span class="podium-name-text">${o.name}</span>
                        <div class="podium-avatar">
                            <div class="char-anim" style="background-image:url('/assets/base_idle_strip9.png')"></div>
                            ${r?`<div class="char-anim" style="background-image:url('/assets/${r}_idle_strip9.png')"></div>`:""}
                        </div>
                        <div class="podium-score">${o.score}</div>
                    </div>
                </div>
            `}).join("");this.container.innerHTML=`
            <img src="/logo/Zigma-logo-fix.webp" class="logo-left" />
            <img src="/logo/gameforsmart-logo-fix.webp" class="logo-right" />
            <div class="podium-section">${s}</div>
            <div class="list-section">${i.map(t=>`
                <div class="list-item">
                    <span>#${t.rank}</span><span>${t.name}</span><span>${n(t.duration)}</span><span>${t.score}</span>
                </div>
            `).join("")}</div>
            <div class="lb-footer">
                <button id="lb-home-btn" class="nav-btn"><span class="material-symbols-outlined">home</span></button>
                <button id="lb-stats-btn" class="nav-btn"><span class="material-symbols-outlined">analytics</span></button>
                <button id="lb-back-btn" class="nav-btn"><span class="material-symbols-outlined">person</span></button>
            </div>
        `,this.attachListeners()}attachListeners(){const e=document.getElementById("lb-home-btn"),i=document.getElementById("lb-back-btn"),n=document.getElementById("lb-stats-btn");e&&(e.onclick=()=>a.transitionTo(()=>{this.cleanup(),this.room&&this.room.leave(),window.location.href="/"})),i&&(i.onclick=()=>a.transitionTo(()=>{this.cleanup(),l(()=>import("./page-G53svSUP.js"),__vite__mapDeps([0,1])).then(s=>{new s.ResultManager().start({room:this.room,leaderboardData:this.rankings})})})),n&&(n.onclick=()=>{const s=localStorage.getItem("supabaseSessionId");s?window.open(`https://gameforsmartnewui.vercel.app/stat/${s}`,"_blank"):alert("ID Sesi tidak ditemukan.")})}cleanup(){this.container&&this.container.remove();const e=document.getElementById("leaderboard-styles");e&&e.remove()}}export{m as PlayerLeaderboardManager};
