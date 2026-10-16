export function createRabbitPublisher({env=process.env,fetchImpl=fetch}={}) {
  return async event => {
    if(!env.RABBITMQ_HTTP_URL || !env.RABBITMQ_USERNAME || !env.RABBITMQ_PASSWORD)throw new Error('Brak konfiguracji kolejki.');
    const base=new URL(env.RABBITMQ_HTTP_URL);
    if(base.protocol!=='https:')throw new Error('RabbitMQ wymaga HTTPS.');
    const response=await fetchImpl(new URL('/api/exchanges/%2F/amq.default/publish',base),{
      method:'POST',redirect:'error',signal:AbortSignal.timeout(8000),
      headers:{'Content-Type':'application/json',Authorization:`Basic ${Buffer.from(`${env.RABBITMQ_USERNAME}:${env.RABBITMQ_PASSWORD}`).toString('base64')}`},
      body:JSON.stringify({properties:{delivery_mode:2,content_type:'application/json',message_id:event.eventId},routing_key:'java-lab.activity',payload:JSON.stringify(event),payload_encoding:'string'}),
    });
    if(!response.ok || (await response.json()).routed!==true)throw new Error('Nie dostarczono wiadomości do kolejki.');
  };
}
