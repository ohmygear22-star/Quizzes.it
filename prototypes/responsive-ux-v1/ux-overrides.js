(function(){
  var languageOpen=false;
  var baseRender=render;
  function addFooter(){
    var footer=document.querySelector('footer');
    if(!footer)return;
    footer.innerHTML='';
    var label=document.createElement('span'); label.textContent='© Quizzes it'; footer.appendChild(label);
    var links=document.createElement('span'); links.className='footerLinks';
    [['Privacy','#privacy'],['Terms','#terms'],['Support','#support']].forEach(function(item){var a=document.createElement('a');a.textContent=lang==='en'?item[0]:(item[0]==='Privacy'?'私隱':item[0]==='Terms'?'條款':'支援');a.href=item[1];links.appendChild(a);});
    footer.appendChild(links);
  }
  function splitMenus(){
    var langButton=document.querySelector('.lang');
    var menu=document.querySelector('.menu');
    if(langButton){langButton.textContent='🌐';langButton.setAttribute('aria-label',lang==='en'?'Language':'語言');langButton.title=lang==='en'?'Language':'語言';langButton.onclick=window.toggleLanguage;}
    if(menu&&!document.querySelector('.langMenu')){
      var lm=document.createElement('div');lm.className='langMenu';lm.setAttribute('role','menu');
      var buttons=[].slice.call(menu.querySelectorAll('button')).slice(0,2);
      buttons.forEach(function(b){lm.appendChild(b);});
      menu.parentNode.insertBefore(lm,menu);
    }
    var lm=document.querySelector('.langMenu'); if(lm){lm.style.display=languageOpen?'grid':'none';lm.style.position='absolute';lm.style.right='72px';lm.style.top='58px';lm.style.zIndex='30';}
  }
  function cleanToolbar(){
    document.querySelectorAll('#bar button').forEach(function(b){if(['retake','email','status'].indexOf(b.textContent.trim())>=0)b.remove();});
  }
  function tuneCopy(){
    var main=document.querySelector('main'); if(!main)return;
    if(screen==='home'){
      main.classList.add('home');
      var lead=main.querySelector('.lead');
      if(lead&&!main.querySelector('.homeMeta')){var meta=document.createElement('div');meta.className='homeMeta';meta.innerHTML='<span>5 '+(lang==='en'?'questions':'條題目')+'</span><span>'+(lang==='en'?'6–9 minutes':'約 6–9 分鐘')+'</span><span>HK$29 · '+(lang==='en'?'one-time':'一次性')+'</span>';lead.after(meta);}
      if(lead)lead.textContent=lang==='en'?'Start with five-question preview. Unlock the complete personal analysis only if you want to continue.':'先回答五條題目；如果想繼續，再解鎖完整個人分析。';
      var trust=main.querySelector('.trust');if(trust)trust.textContent=lang==='en'?'No account needed. Private access by email.':'無需帳戶。完成付款後，我們會以電郵提供私人存取連結。';
    }
    if(screen==='detail'){
      main.querySelectorAll('*').forEach(function(el){if(el.children.length===0){el.textContent=el.textContent.replace(/5 free preview questions|5 free questions|5 preview questions|五條免費預覽題目|五條預覽題目/g,'').replace(/Your early insight is free\.?|你的早期洞察是免費的。?/g,'').trim();}});
    }
    if(screen==='preview'||screen==='adaptive'){
      var eyebrow=main.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent=eyebrow.textContent.replace(/FREE PREVIEW/g,'QUESTION').replace(/免費預覽/g,'問題');
      var hint=main.querySelector('p:not(.eyebrow)');if(hint)hint.style.fontSize='0.9rem';
    }
    if(screen==='insight'){
      main.querySelectorAll('*').forEach(function(el){if(el.children.length===0&&/EARLY SIGNAL|早期訊號|early insight|早期洞察/i.test(el.textContent)){el.remove();}});
    }
    if(screen==='paywall'){
      var details=main.querySelector('.details');if(details)details.remove();
      main.querySelectorAll('*').forEach(function(el){if(el.children.length===0)el.textContent=el.textContent.replace(/Your five preview answers are saved\.?/g,'Your answers are saved.').replace(/你的五條預覽答案已儲存。?/g,'你的答案已儲存。');});
    }
    addFooter();
  }
  window.toggleLanguage=function(){languageOpen=!languageOpen;menu=false;render();};
  window.toggleMenu=function(){menu=!menu;languageOpen=false;render();};
  render=function(){baseRender();splitMenus();cleanToolbar();tuneCopy();};
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&(languageOpen||menu)){languageOpen=false;menu=false;render();}});
  document.addEventListener('click',function(e){if((languageOpen||menu)&&!e.target.closest('.lang')&&!e.target.closest('.langMenu')&&!e.target.closest('.menu')&&!e.target.closest('.menuBtn')){languageOpen=false;menu=false;render();}});
  render();
})();
