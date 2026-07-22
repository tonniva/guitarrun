const form=document.getElementById('contactForm'),status=document.getElementById('contactStatus'),submit=document.getElementById('contactSubmit');
const cfg=window.__GUITARRUN_CONFIG__||{},raw=String(cfg.apiBase||'http://127.0.0.1:4100').trim();
const apiBase=(/^https?:\/\//i.test(raw)?raw:`https://${raw.replace(/^\/+/, '')}`).replace(/\/+$/,'');
const defaultStatus='We usually reply within 1–2 business days.';

form?.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  submit.disabled=true;submit.textContent='Sending…';status.className='';status.textContent='Sending your message securely…';
  const values=Object.fromEntries(new FormData(form).entries());
  try{
    const response=await fetch(`${apiBase}/contact`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});
    if(!response.ok){const result=await response.json().catch(()=>({}));throw new Error(result.error||`HTTP_${response.status}`)}
    form.reset();status.className='success';status.textContent='Message sent. Thank you—we’ll be in touch soon.';
    window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'contact_submit'});
  }catch(error){status.className='error';status.textContent=error.message==='CONTACT_RATE_LIMIT'?'Too many messages. Please try again later.':'Message could not be sent. Please try again.'}
  finally{submit.disabled=false;submit.textContent='Send message →';if(status.className==='')status.textContent=defaultStatus}
});
