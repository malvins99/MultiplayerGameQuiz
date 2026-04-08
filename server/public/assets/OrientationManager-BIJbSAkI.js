const n=class n{static init(){this.overlay||(this.overlay=document.createElement("div"),this.overlay.id="global-orientation-overlay",this.overlay.style.cssText=`
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(18, 18, 22, 0.95); z-index: 999999; display: none;
            flex-direction: column; justify-content: center; align-items: center;
            color: white; font-family: 'Retro Gaming', monospace; text-align: center;
            padding: 20px; backdrop-filter: blur(8px); pointer-events: auto;
        `,document.body.appendChild(this.overlay),window.addEventListener("resize",()=>this.check()),window.addEventListener("orientationchange",()=>this.check()))}static requireLandscape(e,t){this.init(),this.currentRequirement="landscape",this.customTitle=e||null,this.customDescription=t||null,this.updateOverlayContent(),this.check()}static requirePortrait(e,t){this.init(),this.currentRequirement="portrait",this.customTitle=e||null,this.customDescription=t||null,this.updateOverlayContent(),this.check()}static disable(){this.currentRequirement="none",this.overlay&&(this.overlay.style.display="none")}static check(){if(this.currentRequirement==="none")return;if(!(window.innerWidth<=768||/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))){this.overlay&&(this.overlay.style.display="none");return}const t=window.innerHeight>window.innerWidth;let i=!1;if((this.currentRequirement==="landscape"&&t||this.currentRequirement==="portrait"&&!t)&&(i=!0),this.overlay){const s=this.overlay.style.display==="flex";this.overlay.style.display=i?"flex":"none",s&&!i&&(console.log("[OrientationManager] Requirement met. Forcing resize event."),window.dispatchEvent(new Event("resize")),setTimeout(()=>window.dispatchEvent(new Event("resize")),150),setTimeout(()=>window.dispatchEvent(new Event("resize")),400))}}static updateOverlayContent(){if(!this.overlay)return;const e=this.currentRequirement==="landscape",t=this.customTitle||(e?"MODE LANDSCAPE DIPERLUKAN":"MODE PORTRAIT DIPERLUKAN"),i=this.customDescription||(e?"Putar layar HP Anda secara mendatar untuk dapat mengontrol karakter dengan leluasa serta melihat map dengan luas.":"Putar layar HP Anda kembali ke mode portrait untuk melihat hasil pertandingan dan leaderboard dengan lebih baik."),s="screen_rotation",o="PUTAR SEKARANG";this.overlay.innerHTML=`
            <div style="background: rgba(0,0,0,0.85); padding: 40px; border-radius: 20px; border: 2px solid #72BF78; display: flex; flex-direction: column; align-items: center; max-width: 90vw;">
                <span class="material-symbols-outlined" style="font-size: 80px; margin-bottom: 20px; color: #72BF78; animation: rotateDevice 2s infinite ease-in-out;">${s}</span>
                <h2 style="font-size: 26px; margin-bottom: 15px; color: #72BF78; text-transform: uppercase;">${t}</h2>
                <p style="font-size: 14px; color: #eee; line-height: 1.6; max-width: 300px; font-family: sans-serif;">${i}</p>
                <div style="margin-top: 25px; padding: 10px 20px; background: #72BF78; color: #000; border-radius: 6px; font-weight: 800; font-size: 14px;">${o}</div>
            </div>
            <style>
                @keyframes rotateDevice {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(${e?"90deg":"-90deg"}); }
                    100% { transform: rotate(0deg); }
                }
            </style>
        `}};n.overlay=null,n.currentRequirement="none",n.customTitle=null,n.customDescription=null;let r=n;export{r as O};
