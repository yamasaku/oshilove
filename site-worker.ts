import materials from './materials-worker.js';
import radar from './radar-server/worker';
import {redirectFor, identify} from './locale-routes.js';

export default {
  async fetch(request, env, ctx) {
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/radar/')) return radar.fetch(request,env,ctx);
    const redirect=redirectFor(url);
    if(redirect) return new Response(null,{status:301,headers:{Location:redirect.href,'Cache-Control':'public, max-age=3600'}});
    const response=await materials.fetch!(request,env,ctx);
    const route=identify(url.pathname);
    if(route?.page==='radar'){
      const headers=new Headers(response.headers);
      headers.set('Referrer-Policy','no-referrer');
      if(url.searchParams.has('account'))headers.set('X-Robots-Tag','noindex, follow');
      return new Response(response.body,{status:response.status,headers});
    }
    return response;
  }
} satisfies ExportedHandler<Env>;
