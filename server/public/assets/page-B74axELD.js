const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/game-BER8PLQX.js","assets/index-CU7EXP-X.js","assets/characterData-qCqug7LG.js"])))=>i.map(i=>d[i]);
import{_ as d,R as c,T as v}from"./index-CU7EXP-X.js";import{C as w,H as I,g as E}from"./characterData-qCqug7LG.js";class C{constructor(){this.isHost=!1,this.mySessionId="",this.isGameStarting=!1,this.waitingUI=null,this.roomCodeEl=null,this.playerGridEl=null,this.playerCountEl=null,this.startBtn=null,this.waitingMsg=null,this.nameInput=null,this.roomListEl=null,this.hostIndicatorEl=null,this.copyCodeBtn=null,this.copyFeedback=null,this.roomQrCode=null,this.backBtn=null,this.countdownOverlay=null,this.countdownText=null,this.characterPopup=null,this.characterPreviewEl=null,this.qrPopup=null,this.waitingSpawnerInterval=null}async init(t){t.room&&(this.room=t.room,this.mySessionId=this.room.sessionId),this.isHost=t.isHost!==void 0?t.isHost:!1,t.isRestore&&!this.room&&t.client&&await this.restoreRoom(t.client),this.start()}async restoreRoom(t){const i=localStorage.getItem("currentReconnectionToken");if(!i){console.warn("Cannot restore player room: No reconnection token saved."),this.cleanupAndGoLobby();return}try{console.log("Player reconnecting with token..."),this.room=await t.reconnect(i),console.log("Player reconnected!",this.room),this.mySessionId=this.room.sessionId,localStorage.setItem("currentReconnectionToken",this.room.reconnectionToken),this.setupRoomListeners()}catch(a){console.warn("Player reconnection failed:",a),localStorage.removeItem("currentRoomId"),localStorage.removeItem("currentSessionId"),localStorage.removeItem("currentReconnectionToken"),this.cleanupAndGoLobby()}}startGameEngine(t,i){d(()=>import("./game-BER8PLQX.js"),__vite__mapDeps([0,1,2])).then(a=>{a.initializeGame(t,i)}).catch(a=>{console.error("Failed to load game engine:",a),window.location.href="/"})}startManager(t,i){t==="LobbyManager"&&d(()=>import("./index-CU7EXP-X.js").then(a=>a.p),[]).then(a=>{new a.LobbyManager().init(i)})}cleanupAndGoLobby(){var i;this.waitingUI&&this.waitingUI.classList.add("hidden");const t=document.getElementById("waiting-ui");t&&t.classList.add("hidden"),this.countdownOverlay&&(this.countdownOverlay.remove(),this.countdownOverlay=null),(i=document.getElementById("exit-confirm-modal"))==null||i.remove(),c.navigate("/"),this.startManager("LobbyManager")}setupRoomListeners(){this.room.state.listen("hostId",t=>{t===this.mySessionId&&this.startGameEngine("HostWaitingRoomScene",{room:this.room,isHost:!0}),this.updateUILayout()}),this.room.state.players.onAdd((t,i)=>{this.updateAll(),t.listen("name",()=>this.updateAll()),t.listen("hairId",()=>this.updateAll())}),this.room.state.players.onRemove(()=>this.updateAll()),this.room.onMessage("gameStarted",()=>{this.handleGameStart()}),this.room.onMessage("kicked",t=>{this.leaveRoom()})}start(){this.waitingUI=document.getElementById("waiting-ui");const t=document.getElementById("lobby-ui");t&&t.classList.add("hidden"),this.waitingUI&&(this.waitingUI.classList.remove("hidden"),this.setupPlayerUI()),this.playerGridEl=document.getElementById("player-grid"),this.playerCountEl=document.getElementById("player-count-value"),this.nameInput=document.getElementById("header-player-name"),this.backBtn=document.getElementById("player-back-btn"),this.backBtn&&(this.backBtn.onclick=()=>{this.showExitConfirm()});const i=document.getElementById("player-choose-char-btn");i&&(i.onclick=()=>{var e;const a=this.room.state.players.get(this.mySessionId);(e=this.characterPopup)==null||e.show((a==null?void 0:a.hairId)||0)}),this.room&&this.setupRoomListeners(),this.characterPopup=new w(I,a=>{this.room&&this.room.send("updateHair",{hairId:a})},()=>{}),this.updateAll(),this.updateUILayout(),this.createCountdownOverlay(),this.room&&(this.room.state.listen("countdown",(a,e)=>{a>0?(this.countdownOverlay&&this.countdownOverlay.classList.remove("hidden"),this.countdownText&&(this.countdownText.innerText=a.toString()),this.handleGameStart()):a===0&&(e||0)>0?this.countdownText&&(this.countdownText.innerText="GO!"):a===0&&this.countdownOverlay&&this.countdownOverlay.classList.add("hidden")}),this.room.state.listen("isGameStarted",a=>{a&&this.handleGameStart()}))}handleGameStart(){this.isGameStarting||(this.isGameStarting=!0,this.countdownOverlay&&(this.countdownOverlay.remove(),this.countdownOverlay=null),v.ensureClosed(),this.waitingUI&&this.waitingUI.classList.add("hidden"),c.navigate("/game"),this.startGameEngine("GameScene",{room:this.room}))}createCountdownOverlay(){const t=document.createElement("div");t.id="player-countdown-overlay",t.className="fixed inset-0 z-50 bg-black flex items-center justify-center hidden",t.innerHTML=`
            <div class="flex flex-col items-center animate-bounce">
                <div id="player-countdown-text" class="text-[120px] font-['Retro_Gaming'] text-[#00ff88] drop-shadow-[0_0_30px_rgba(0,255,136,0.6)]">
                    10
                </div>
            </div>
        `,document.body.appendChild(t),this.countdownOverlay=t,this.countdownText=document.getElementById("player-countdown-text")}setupPlayerUI(){if(!this.waitingUI)return;const t="player-waiting-room-styles";if(!document.getElementById(t)){const i=document.createElement("style");i.id=t,i.innerHTML=`
                .player-content-box {
                    background: #2d5a27;
                    border: none;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    border-radius: 20px;
                    width: 95%;
                    max-width: 1100px;
                    height: auto;
                    min-height: 220px;
                    max-height: 520px;
                    position: relative;
                    padding: 25px;
                    display: flex;
                    flex-direction: column;
                    margin-top: 10px;
                }
                .custom-scrollbar {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    display: none !important;
                }
                .player-header-section {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                /* Red Exit Button Style */
                .btn-exit-standard {
                    padding: 0 30px;
                    height: 52px;
                    background: #ef4444; /* red-500 */
                    border-radius: 12px;
                    color: white;
                    font-family: 'Retro Gaming';
                    text-transform: uppercase;
                    font-size: 11px;
                    border: none;
                    border-bottom: 4px solid #b91c1c; /* red-700 */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transition: all 0.1s;
                    cursor: pointer;
                }
                .btn-exit-standard:hover {
                    filter: brightness(1.1);
                }
                .btn-exit-standard:active {
                    border-bottom-width: 0;
                    transform: translateY(4px);
                }
                .player-count-box {
                    background: transparent;
                    border: 2px solid #FFFFFF;
                    border-radius: 10px;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .player-count-value {
                    color: #FFFFFF;
                    font-family: 'Retro Gaming';
                    font-size: 16px;
                }
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
                .neon-title-standard {
                    font-family: 'Retro Gaming';
                    font-size: 38px;
                    color: #00ff88;
                    text-shadow: 0 0 15px rgba(0, 255, 136, 0.4), 3px 3px 0px #000;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                }
                .player-card-standard {
                    background: #6CC452;
                    border: none;
                    border-radius: 16px;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0px;
                    position: relative;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    min-height: 140px;
                }
                .player-card-active {
                    /* No border as requested, maybe a subtle scale or shadow if needed, but keeping it simple for now */
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                }
                .pill-you {
                    background: #FFFFFF;
                    color: #6CC452;
                    font-family: 'Retro Gaming';
                    font-size: 10px;
                    padding: 6px 20px;
                    border-radius: 100px;
                    font-weight: bold;
                    white-space: nowrap;
                    text-transform: uppercase;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .standard-pixel-btn {
                    height: 52px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-family: 'Retro Gaming';
                    text-transform: uppercase;
                    transition: all 0.1s;
                }
                .standard-pixel-btn:active {
                    border-bottom-width: 0;
                    transform: translateY(4px);
                }
                .btn-choose-char-green {
                    padding: 0 40px;
                    background: #92C140;
                    border-radius: 12px;
                    color: white;
                    font-family: 'Retro Gaming';
                    text-transform: uppercase;
                    font-size: 11px;
                    border: none;
                    border-bottom: 4px solid #478D47;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .btn-choose-char-green:active {
                    box-shadow: none;
                }
                @keyframes play-idle {
                    from { background-position: 0 0; }
                    to { background-position: -864px 0; }
                }

                /* Responsive Additions */
                .logo-tl {
                    position: absolute;
                    top: -30px;
                    left: -40px;
                    width: 16rem; /* 256px (w-64) */
                }
                .logo-tr {
                    position: absolute;
                    top: -45px;
                    right: -15px;
                    width: 20rem; /* 320px (w-80) */
                }
                .player-grid-responsive {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
                    gap: 12px;
                    padding: 10px;
                    width: 100%;
                    justify-content: center;
                }
                .player-card-wrapper {
                    aspect-ratio: 1 / 1.1;
                    width: 100%;
                    max-width: 148px;
                    margin: 0 auto;
                }
                
                @media (max-width: 932px) and (orientation: landscape) {
                    .logo-tl {
                        top: -10px !important;
                        left: -15px !important;
                        width: 8rem !important;
                    }
                    .logo-tr {
                        top: -15px !important;
                        right: -5px !important;
                        width: 10rem !important;
                    }
                    .player-content-box {
                        margin-top: 10px !important;
                        padding: 10px !important;
                        min-height: 120px !important;
                        max-height: 55vh !important;
                        margin-bottom: 50px !important;
                    }
                    .player-header-section {
                        margin-bottom: 10px !important;
                        padding-bottom: 8px !important;
                    }
                    .pt-16 {
                        padding-top: 2rem !important;
                    }
                }
                
                @media (max-width: 768px) {
                    .logo-tl {
                        top: -15px;
                        left: -20px;
                        width: 9rem;
                    }
                    .logo-tr {
                        top: -20px;
                        right: -5px;
                        width: 11rem;
                    }
                    .player-content-box {
                        margin-top: 20px;
                        padding: 15px;
                        min-height: 160px;
                        flex: 1;
                        max-height: calc(100vh - 160px);
                        margin-bottom: 70px;
                    }
                    .fixed.bottom-10 {
                        bottom: 1.2rem !important;
                    }
                    .btn-exit-standard {
                        padding: 0 16px;
                        height: 40px;
                        font-size: 10px;
                    }
                    .btn-choose-char-green {
                        padding: 0 16px;
                        height: 40px;
                        font-size: 10px;
                    }
                    .player-grid-responsive {
                        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                        gap: 8px;
                        padding: 5px;
                    }
                    .player-card-wrapper {
                        max-width: 100%;
                    }
                }
            `,document.head.appendChild(i)}this.waitingUI.innerHTML=`
            <!-- Full-Screen Background — same as home page -->
            <div class="absolute inset-0" style="background: linear-gradient(180deg, #6CC452 0%, #478D47 100%);"></div>

            <!-- Pixel-art Background Decorations -->
            <div class="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <!-- Subtle pixel grid pattern -->
                <div class="absolute inset-0 opacity-[0.06]" style="background-image: radial-gradient(#2d5a30 1px, transparent 1px); background-size: 24px 24px;"></div>

                <!-- L1: Back Layer (Small/Medium, Slow) -->
                <div class="absolute top-[10%] opacity-20 animate-[drift_80s_linear_infinite]" style="transform: scale(1.0); left: -10%;">
                    <div class="relative w-10 h-3 bg-white">
                        <div class="absolute -top-1 left-2 w-3 h-1 bg-white"></div>
                    </div>
                </div>
                <div class="absolute top-[45%] opacity-15 animate-[drift_95s_linear_infinite_reverse]" style="transform: scale(0.8); left: 80%;">
                    <div class="relative w-12 h-4 bg-[#D3EE98]">
                        <div class="absolute -top-2 left-3 w-4 h-2 bg-[#D3EE98]"></div>
                    </div>
                </div>
                <div class="absolute top-[15%] opacity-15 animate-[drift_110s_linear_infinite]" style="transform: scale(1.2); left: 40%;">
                    <div class="relative w-14 h-4 bg-white">
                        <div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div>
                    </div>
                </div>

                <!-- L2: Mid Layer (Medium) -->
                <div class="absolute top-[25%] opacity-40 animate-[drift_45s_linear_infinite]" style="transform: scale(1.8); left: 15%;">
                    <div class="relative w-16 h-5 bg-[#D3EE98]">
                        <div class="absolute -top-3 left-4 w-6 h-3 bg-[#D3EE98]"></div>
                        <div class="absolute -top-5 left-8 w-4 h-5 bg-[#D3EE98]"></div>
                    </div>
                </div>
                <div class="absolute top-[65%] opacity-35 animate-[drift_55s_linear_infinite_reverse]" style="transform: scale(1.5); left: 60%;">
                    <div class="relative w-14 h-4 bg-white">
                        <div class="absolute -top-2 left-4 w-5 h-2 bg-white"></div>
                        <div class="absolute -top-4 left-7 w-3 h-4 bg-white"></div>
                    </div>
                </div>
                <div class="absolute top-[5%] opacity-25 animate-[drift_70s_linear_infinite]" style="transform: scale(1.7); left: 75%;">
                    <div class="relative w-16 h-5 bg-[#D3EE98]">
                        <div class="absolute -top-3 left-5 w-6 h-3 bg-[#D3EE98]"></div>
                    </div>
                </div>

                <!-- L3: Front Layer (Large, Faster) -->
                <div class="absolute top-[40%] opacity-30 animate-[drift_35s_linear_infinite]" style="transform: scale(2.5); left: -20%;">
                    <div class="relative w-12 h-4 bg-[#FEFF9F]">
                        <div class="absolute -top-2 left-2 w-4 h-2 bg-[#FEFF9F]"></div>
                        <div class="absolute -top-4 left-5 w-4 h-4 bg-[#FEFF9F]"></div>
                    </div>
                </div>
                <div class="absolute top-[75%] opacity-25 animate-[drift_40s_linear_infinite_reverse]" style="transform: scale(2.2); left: 40%;">
                    <div class="relative w-18 h-6 bg-white">
                        <div class="absolute -top-3 left-5 w-7 h-3 bg-white"></div>
                        <div class="absolute -top-6 left-10 w-5 h-6 bg-white"></div>
                    </div>
                </div>
                <div class="absolute top-[50%] opacity-20 animate-[drift_30s_linear_infinite]" style="transform: scale(3.0); left: 10%;">
                    <div class="relative w-14 h-4 bg-[#FEFF9F]">
                        <div class="absolute -top-2 left-4 w-5 h-2 bg-[#FEFF9F]"></div>
                    </div>
                </div>

                <!-- Floating Particles -->
                <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 25%; left: 15%; animation-delay: 0s;"></div>
                <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 65%; left: 80%; animation-delay: 1.5s;"></div>
                <div class="firefly !bg-[#D3EE98] !shadow-[0_0_15px_rgba(211,238,152,0.9)]" style="top: 45%; left: 45%; animation-delay: 3s;"></div>
                <div class="firefly !bg-[#FEFF9F] !shadow-[0_0_15px_rgba(254,255,159,0.9)]" style="top: 85%; left: 20%; animation-delay: 4.5s;"></div>
                <div class="firefly !bg-white !shadow-[0_0_15px_rgba(255,255,255,0.8)]" style="top: 15%; left: 70%; animation-delay: 6s;"></div>
            </div>

            <!-- Walking Characters Container -->
            <div id="player-waiting-characters-container" class="absolute inset-0 z-0 overflow-hidden pointer-events-none"></div>
            
            <!-- LOGO TOP LEFT -->
            <img src="/logo/Zigma-logo-fix.webp" class="logo-tl z-20 object-contain" />
            
            <!-- LOGO TOP RIGHT -->
            <img src="/logo/gameforsmart-logo-fix.webp" class="logo-tr z-20 object-contain" />

            <div class="relative z-10 flex flex-col items-center justify-start w-full h-screen p-4 md:pt-20 pt-16 overflow-hidden">
                <!-- Main Content Box (Host Style Container) -->
                <div class="player-content-box">
                    <div class="player-header-section">
                        <div class="player-count-box">
                            <span class="material-symbols-outlined text-white text-xl">person</span>
                            <span id="player-count-value" class="player-count-value">1</span>
                        </div>
                    </div>

                    <!-- Player Grid -->
                    <div id="player-grid" class="flex-1 overflow-y-auto custom-scrollbar px-2 player-grid-responsive">
                        <!-- Player items injected here -->
                    </div>
                </div>
            </div>

            <!-- Sticky Bottom Buttons -->
            <div class="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30 w-[90%] md:w-auto justify-center">
                <!-- EXIT Button (Red Host Style) -->
                <button id="player-back-btn" class="standard-pixel-btn btn-exit-standard">
                    EXIT
                </button>

                <!-- Pill Choose Character (Host Start Button Style) -->
                <button id="player-choose-char-btn" class="standard-pixel-btn btn-choose-char-green">
                    CHOOSE CHARACTER
                </button>
            </div>
        `,this.startWaitingCharacterSpawner("player-waiting-characters-container")}updateCharacterPreview(t){const i=document.getElementById("character-preview-box");if(!i)return;i.innerHTML="";const a=document.createElement("div");a.className='absolute inset-0 bg-[url("/assets/bg_pattern.png")] opacity-20',i.appendChild(a);const e=document.createElement("div");e.style.backgroundImage="url('/assets/base_idle_strip9.png')",e.style.width="96px",e.style.height="64px",e.style.backgroundSize="864px 64px",e.style.imageRendering="pixelated",e.style.position="absolute",e.style.top="50%",e.style.left="50%",e.style.transform="translate(-50%, -50%) scale(5)",e.style.animation="play-idle 1s steps(9) infinite",i.appendChild(e),t>0&&d(async()=>{const{getHairById:o}=await import("./characterData-qCqug7LG.js").then(s=>s.c);return{getHairById:o}},[]).then(({getHairById:o})=>{const s=o(t);if(s){const n=document.createElement("div");n.style.backgroundImage=`url('/assets/${s.idleKey}_strip9.png')`,n.style.width="96px",n.style.height="64px",n.style.backgroundSize="864px 64px",n.style.imageRendering="pixelated",n.style.position="absolute",n.style.top="50%",n.style.left="50%",n.style.transform="translate(-50%, -50%) scale(5)",n.style.animation="play-idle 1s steps(9) infinite",i.appendChild(n)}})}showExitConfirm(){var i,a,e;(i=document.getElementById("exit-confirm-modal"))==null||i.remove();const t=document.createElement("div");t.id="exit-confirm-modal",t.style.cssText=`
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(0,0,0,0.75);
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.15s ease;
        `,t.innerHTML=`
            <style>
                @keyframes popIn {
                    from { transform: scale(0.85); opacity: 0; }
                    to   { transform: scale(1);    opacity: 1; }
                }
                #exit-confirm-box {
                    animation: popIn 0.2s cubic-bezier(.34,1.56,.64,1);
                    background: #1a1a2e;
                    border: 3px solid #ef4444;
                    border-radius: 16px;
                    box-shadow: 0 0 40px rgba(239,68,68,0.3), 0 20px 60px rgba(0,0,0,0.8);
                    padding: 36px 40px;
                    text-align: center;
                    min-width: 320px;
                    max-width: 90vw;
                }
                #exit-confirm-box h2 {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 14px;
                    color: #ef4444;
                    margin-bottom: 12px;
                    line-height: 1.6;
                }
                #exit-confirm-box p {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 9px;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 28px;
                    line-height: 1.8;
                }
                .exit-btn-row {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                .btn-cancel-exit {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 9px;
                    padding: 12px 24px;
                    background: rgba(255,255,255,0.08);
                    border: 2px solid rgba(255,255,255,0.15);
                    border-radius: 10px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .btn-cancel-exit:hover { background: rgba(255,255,255,0.15); }
                .btn-confirm-exit {
                    font-family: 'Press Start 2P', monospace;
                    font-size: 9px;
                    padding: 12px 24px;
                    background: #ef4444;
                    border: 2px solid #b91c1c;
                    border-radius: 10px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.15s;
                    border-bottom-width: 4px;
                }
                .btn-confirm-exit:hover { filter: brightness(1.15); }
                .btn-confirm-exit:active { border-bottom-width: 2px; transform: translateY(2px); }
            </style>
            <div id="exit-confirm-box">
                <h2>⚠ KELUAR?</h2>
                <p>Kamu akan meninggalkan<br>ruangan ini.</p>
                <div class="exit-btn-row">
                    <button class="btn-cancel-exit" id="exit-cancel-btn">BATAL</button>
                    <button class="btn-confirm-exit" id="exit-confirm-btn">YA, KELUAR</button>
                </div>
            </div>
        `,document.body.appendChild(t),t.addEventListener("click",o=>{o.target===t&&t.remove()}),(a=document.getElementById("exit-cancel-btn"))==null||a.addEventListener("click",()=>{t.remove()}),(e=document.getElementById("exit-confirm-btn"))==null||e.addEventListener("click",()=>{t.remove(),this.leaveRoom()})}leaveRoom(){this.room&&this.room.leave(),localStorage.removeItem("currentRoomId"),localStorage.removeItem("currentSessionId"),localStorage.removeItem("currentReconnectionToken"),localStorage.removeItem("pendingJoinRoomCode"),this.waitingUI&&this.waitingUI.classList.add("hidden"),this.countdownOverlay&&(this.countdownOverlay.remove(),this.countdownOverlay=null);const t=document.getElementById("lobby-ui");t&&t.classList.remove("hidden"),c.replace("/"),this.startManager("LobbyManager",{didExit:!0})}showCopyFeedback(){this.copyFeedback&&(this.copyFeedback.classList.remove("opacity-0"),setTimeout(()=>{var t;(t=this.copyFeedback)==null||t.classList.add("opacity-0")},2e3))}updateAll(){this.updatePlayerGrid();const t=this.room.state.players.get(this.mySessionId);t&&this.updateCharacterPreview(t.hairId||0)}updateRoomCode(){const t=this.room.state.roomCode;this.roomCodeEl&&(this.roomCodeEl.innerText=t||"------"),this.updateQrCode(t)}updateQrCode(t){if(this.roomQrCode&&t){const i=`${window.location.origin}?room=${t}`;this.roomQrCode.src=`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(i)}`}}updateUILayout(){let t=0;this.room.state.players.forEach(i=>{i.isHost||t++}),this.playerCountEl&&(this.playerCountEl.innerText=t.toString())}updateRoomList(){if(!this.roomListEl)return;const t=this.room.state.players.get(this.mySessionId),i=t?t.subRoomId:"";let a="";this.room.state.subRooms.forEach(e=>{const o=e.id===i,s=e.playerIds.length,n=s>=e.capacity,r=o?"border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,255,85,0.1)]":"border-white/10 bg-black/40 hover:border-white/30",g=o?"text-primary":"text-white",b=n?"bg-white/10 text-white/30 cursor-not-allowed border-gray-600":o?"bg-primary text-black font-bold pixel-btn-green border-black":"bg-secondary text-black font-bold pixel-btn-blue border-black hover:brightness-110",u=o?"JOINED":n?"FULL":"JOIN",x=this.isHost||n||o?"":`onclick="window.switchRoom('${e.id}')"`,y=this.isHost?"invisible":"";let l="",p=0;e.playerIds.forEach(m=>{const h=this.room.state.players.get(m);if(h){const f=m===this.mySessionId?"text-primary":"text-white/70";l+=`
                        <div class="flex items-center gap-2 ${f} text-[10px] font-bold uppercase truncate">
                            <span class="material-symbols-outlined text-[10px] opacity-70">person</span>
                            ${h.name}
                        </div>`,p++}}),p===0&&(l='<span class="text-[10px] text-white/30 italic pl-1">Empty</span>'),a+=`
                <div class="w-full max-w-[320px] border-2 ${r} p-4 rounded-xl transition-all duration-300 relative group">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-sm font-bold uppercase ${g} font-['Press_Start_2P'] tracking-tight">${e.id}</span>
                        <div class="px-2 py-1 bg-black/60 rounded text-[10px] font-bold text-white/80 border border-white/5">
                            ${s}/${e.capacity}
                        </div>
                    </div>
                    
                    <div class="space-y-1 mb-4 min-h-[40px]">
                        ${l}
                    </div>

                    <button ${x} class="w-full py-3 text-xs uppercase rounded-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all ${b} font-['Press_Start_2P'] tracking-wide ${y}">
                        ${u}
                    </button>
                </div>
            `}),this.roomListEl.innerHTML=a,window.switchRoom=e=>{this.room.send("switchRoom",{roomId:e})}}updatePlayerGrid(){if(!this.playerGridEl)return;const t=new Map;this.room.state.players.forEach((e,o)=>{!e.isHost&&!t.has(o)&&t.set(o,{sessionId:o,name:e.name,hairId:e.hairId,isHost:e.isHost})});const i=Array.from(t.values());i.sort((e,o)=>e.sessionId===this.mySessionId?-1:o.sessionId===this.mySessionId?1:0),this.updateUILayout();let a="";i.forEach(e=>{const o=e.sessionId===this.mySessionId,s=o?"player-card-standard player-card-active":"player-card-standard",n=o?'<div class="absolute -bottom-3 left-1/2 -translate-x-1/2 pill-you">YOU</div>':"";a+=`
                <div class="${s} player-card-wrapper">
                    <!-- Character (Middle) -->
                    <div style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; overflow: visible; margin-top: 5px;">
                         <div style="
                            position: relative;
                            width: 32px; height: 32px; 
                            transform: scale(3.5) translateY(4px);
                         ">
                            <div style="
                                position: absolute; inset: 0;
                                background-image: url('/assets/base_idle_strip9.png');
                                background-repeat: no-repeat;
                                background-position: -32px -16px;
                                image-rendering: pixelated;
                            "></div>
                            ${(()=>{const r=E(e.hairId||0);return e.hairId>0&&r?`
                                        <div style="
                                            position: absolute; inset: 0;
                                            background-image: url('/assets/${r.idleKey}_strip9.png');
                                            background-repeat: no-repeat;
                                            background-position: -32px -16px;
                                            image-rendering: pixelated;
                                        "></div>
                                    `:""})()}
                         </div>
                    </div>
                    
                    <!-- Player Name -->
                    <div style="text-align: center; width: 100%; margin-top: 2px; padding: 0 4px;">
                        <span style="font-size: 11px; color: #FFFFFF; font-family: 'Press Start 2P', cursive; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; width: 100%; ${o?"text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);":""}">
                            ${e.name||"PLAYER"}
                        </span>
                    </div>

                    ${n}
                </div>
            `}),this.playerGridEl.innerHTML=a,window.updatePlayerName=e=>{this.room.send("updateName",{name:e})}}startWaitingCharacterSpawner(t){this.waitingSpawnerInterval&&(clearInterval(this.waitingSpawnerInterval),this.waitingSpawnerInterval=null);const i=document.getElementById(t);if(!i)return;const a=()=>{const e=i.querySelectorAll(".walking-char").length;if(e>=3)return;const o=e===0?.8:.4;Math.random()<o&&this.spawnWalkingCharacter(i)};a(),this.waitingSpawnerInterval=setInterval(a,5e3)}spawnWalkingCharacter(t){const i=document.createElement("div");i.className="walking-char";const a=Math.random()>.5,e=20+Math.random()*10;a?(i.style.animation=`base-walk-cycle 0.8s steps(8) infinite, walk-across-left ${e}s linear forwards`,i.style.transform="scale(-1, 1)"):(i.style.animation=`base-walk-cycle 0.8s steps(8) infinite, walk-across-right ${e}s linear forwards`,i.style.transform="scale(1, 1)"),t.appendChild(i),setTimeout(()=>{i.parentElement&&i.remove()},e*1e3+500)}}export{C as PlayerWaitingRoomManager};
