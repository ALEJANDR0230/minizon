import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../../api/client';
import AlertList from '../../components/admin/AlertList';
import LoadingState from '../../components/ui/LoadingState';
import Message from '../../components/ui/Message';
import PageHeader from '../../components/ui/PageHeader';
import { formatCurrency, formatDate } from '../../utils/format';

export default function AdminAdvisorPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatting, setChatting] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Hola. Soy tu asistente de tienda. Puedes preguntarme por ventas, inventario, pedidos, reseñas o ideas de promociones.',
    source: 'local',
  }]);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    apiRequest('/admin/advisor').then(setData).catch((reason) => setError(reason.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const container = chatMessagesRef.current;
    container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, chatting]);

  async function generate() {
    setAnalyzing(true); setError('');
    try {
      setData(await apiRequest('/admin/advisor/generate', { method: 'POST', body: { refresh: true }, timeoutMs: 10000 }));
    } catch (reason) {
      setError(reason.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function sendMessage(event, suggestedMessage = '') {
    event?.preventDefault();
    const question = (suggestedMessage || chatInput).trim();
    if (!question || chatting) return;

    const history = messages.slice(-10).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: 'user', content: question }]);
    setChatInput('');
    setChatting(true);
    setError('');

    try {
      const response = await apiRequest('/admin/advisor/chat', {
        method: 'POST',
        body: { message: question, history },
        timeoutMs: 12000,
      });
      setMessages((current) => [...current, {
        role: 'assistant',
        content: response.message,
        source: response.source,
        notice: response.notice,
      }]);
    } catch (reason) {
      setError(reason.message);
      setMessages((current) => [...current, {
        role: 'assistant',
        content: 'No pude responder en este momento. Intenta nuevamente; tu conversación permanece aquí.',
        source: 'local',
      }]);
    } finally {
      setChatting(false);
    }
  }

  if (loading && !data) return <LoadingState label="Revisando inventario y situaciones…" />;

  return (
    <>
      <PageHeader eyebrow="Administración" title="Asistente administrativo" description="Consulta inventario, ventas, pedidos y reseñas." actions={<button className="button button-secondary" disabled={analyzing} onClick={generate} type="button">{analyzing ? 'Actualizando…' : 'Actualizar sugerencias'}</button>} />
      <Message type="error">{error}</Message>
      <Message type="info">{data?.notice}</Message>

      <section className="admin-conversation">
        <aside className="conversation-prompts">
          <span className="conversation-orb">✦</span>
          <h2>¿Qué quieres saber?</h2>
          <p>Selecciona una consulta o escribe la tuya.</p>
          <button onClick={(event) => sendMessage(event, '¿Qué productos debo reabastecer primero?')} type="button">¿Qué debo reabastecer?</button>
          <button onClick={(event) => sendMessage(event, '¿Qué oferta me recomiendas hacer y por qué?')} type="button">¿Qué oferta puedo hacer?</button>
          <button onClick={(event) => sendMessage(event, 'Resume cómo van mis ventas y pedidos.')} type="button">¿Cómo van ventas y pedidos?</button>
          <button onClick={(event) => sendMessage(event, '¿Hay reseñas o situaciones que deba atender?')} type="button">¿Qué necesita mi atención?</button>
        </aside>
        <div className="conversation-chat">
          <header><span><i />Asistente disponible</span><small>Con información actual de la tienda</small></header>
          <div className="conversation-messages" aria-live="polite" ref={chatMessagesRef}>
            {messages.map((message, index) => (
              <article className={`conversation-message message-${message.role}`} key={`${message.role}-${index}`}>
                <small>{message.role === 'user' ? 'Tú' : 'Asistente'}</small>
                <p>{message.content}</p>
                {message.notice && <em>{message.notice}</em>}
              </article>
            ))}
            {chatting && <article className="conversation-message message-assistant message-thinking"><small>Asistente</small><p><span /><span /><span /></p></article>}
          </div>
          <form className="conversation-form" onSubmit={sendMessage}>
            <textarea aria-label="Escribe tu pregunta" maxLength="1500" onChange={(event) => setChatInput(event.target.value)} placeholder="Escribe, por ejemplo: ¿qué producto tiene más stock?" rows="2" value={chatInput} />
            <div><small>{chatInput.length}/1500</small><button className="button button-primary" disabled={chatting || !chatInput.trim()} type="submit">{chatting ? 'Pensando…' : 'Enviar pregunta'}</button></div>
          </form>
        </div>
      </section>

      <section className="advisor-summary admin-panel">
        <div className="advisor-summary-meta"><span className={`ai-source ${data?.source === 'groq' ? 'active' : ''}`}>{data?.source === 'groq' ? 'Sugerencias actualizadas' : 'Datos de tu tienda'}</span><small>Actualizado {formatDate(data?.generated_at, { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
        <h2>Lo más importante ahora</h2>
        <p>{data?.analysis}</p>
        <small>Son ideas para ayudarte: nada cambia ni se publica sin que tú lo decidas.</small>
      </section>

      <div className="advisor-layout">
        <section className="admin-panel">
          <div className="panel-heading"><div><h2>Ofertas recomendadas</h2><p>Promociones sugeridas por inventario y ventas.</p></div></div>
          {data?.offers?.length ? <div className="offer-list">{data.offers.map((offer) => <article key={offer.product_id}><div><span className="offer-discount">-{offer.discount_percent}%</span><span><strong>{offer.product}</strong><small>{offer.stock} unidades · {offer.units_sold_30_days} vendidas</small></span></div><div className="offer-prices"><small>{formatCurrency(offer.current_price)}</small><strong>{formatCurrency(offer.offer_price)}</strong></div><p>{offer.reason}</p></article>)}</div> : <p className="muted panel-empty">No hay una promoción recomendable en este momento.</p>}
        </section>
        <section className="admin-panel">
          <div className="panel-heading"><div><h2>Alertas administrativas</h2><p>Situaciones que requieren atención.</p></div></div>
          <AlertList alerts={data?.alerts || []} />
        </section>
      </div>
    </>
  );
}
