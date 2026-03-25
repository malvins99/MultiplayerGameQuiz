const i=class i{static init(){this.overlay||(this.overlay=document.createElement("div"),this.overlay.id="global-orientation-overlay",this.overlay.style.cssText=`
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(18, 18, 22, 0.95); z-index: 999999; display: none;
            flex-direction: column; justify-content: center; align-items: center;
            color: white; font-family: 'Retro Gaming', monospace; text-align: center;
            padding: 20px; backdrop-filter: blur(8px); pointer-events: auto;
        `,document.body.appendChild(this.overlay),window.addEventListener("resize",()=>this.check()),window.addEventListener("orientationchange",()=>this.check()))}static requireLandscape(t,e){this.init(),this.currentRequirement="landscape",this.customTitle=t||null,this.customDescription=e||null,this.updateOverlayContent(),this.check()}static requirePortrait(t,e){this.init(),this.currentRequirement="portrait",this.customTitle=t||null,this.customDescription=e||null,this.updateOverlayContent(),this.check()}static disable(){this.currentRequirement="none",this.overlay&&(this.overlay.style.display="none")}static check(){if(this.currentRequirement==="none")return;if(!(window.innerWidth<=768||/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))){this.overlay&&(this.overlay.style.display="none");return}const e=window.innerHeight>window.innerWidth;let n=!1;(this.currentRequirement==="landscape"&&e||this.currentRequirement==="portrait"&&!e)&&(n=!0),this.overlay&&(this.overlay.style.display=n?"flex":"none")}static updateOverlayContent(){if(!this.overlay)return;const t=this.currentRequirement==="landscape",e=this.customTitle||(t?"MODE LANDSCAPE DIPERLUKAN":"MODE PORTRAIT DIPERLUKAN"),n=this.customDescription||(t?"Putar layar HP Anda secara mendatar untuk dapat mengontrol karakter dengan leluasa serta melihat map dengan luas.":"Putar layar HP Anda kembali ke mode portrait untuk melihat hasil pertandingan dan leaderboard dengan lebih baik."),r="screen_rotation",a="PUTAR SEKARANG";this.overlay.innerHTML=`
            <div style="background: rgba(0,0,0,0.85); padding: 40px; border-radius: 20px; border: 2px solid #72BF78; display: flex; flex-direction: column; align-items: center; max-width: 90vw;">
                <span class="material-symbols-outlined" style="font-size: 80px; margin-bottom: 20px; color: #72BF78; animation: rotateDevice 2s infinite ease-in-out;">${r}</span>
                <h2 style="font-size: 26px; margin-bottom: 15px; color: #72BF78; text-transform: uppercase;">${e}</h2>
                <p style="font-size: 14px; color: #eee; line-height: 1.6; max-width: 300px; font-family: sans-serif;">${n}</p>
                <div style="margin-top: 25px; padding: 10px 20px; background: #72BF78; color: #000; border-radius: 6px; font-weight: 800; font-size: 14px;">${a}</div>
            </div>
            <style>
                @keyframes rotateDevice {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(${t?"90deg":"-90deg"}); }
                    100% { transform: rotate(0deg); }
                }
            </style>
        `}};i.overlay=null,i.currentRequirement="none",i.customTitle=null,i.customDescription=null;let s=i;export{s as O};
