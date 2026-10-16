import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cinematicState } from './cinematicState';

const WebGLExperience = lazy(() => import('./WebGLExperience'));

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    id: '01',
    name: 'Lavagem simples',
    category: 'Exterior · carro',
    price: 'A partir de R$ 40',
    description: 'Pré-lavagem, lataria, caixas de roda, pneus, calotas e acabamento externo.',
    note: 'Não inclui limpeza ou aspiração interna.',
  },
  {
    id: '02',
    name: 'Lavagem completa',
    category: 'Exterior + interior · carro',
    price: 'A partir de R$ 80',
    description: 'Limpeza externa, aspiração, painel, portas, vidros, rodas e acabamento.',
    note: 'Uma leitura completa do veículo, por dentro e por fora.',
  },
  {
    id: '03',
    name: 'Lavagem detalhada',
    category: 'Estética premium · carro',
    price: 'A partir de R$ 160',
    description: 'Chassi, cantos, frestas, interior, estofados, plásticos, vidros e rodas.',
    note: 'Abrangência confirmada conforme o veículo.',
  },
  {
    id: '04',
    name: 'Higienização avançada',
    category: 'Interior + exterior · carro',
    price: 'A partir de R$ 350',
    description: 'Limpeza profunda de áreas internas e externas, com escopo definido após avaliação.',
    note: 'A remoção de bancos e o procedimento exato dependem de confirmação.',
  },
  {
    id: '05',
    name: 'Motor',
    category: 'Limpeza técnica',
    price: 'A partir de R$ 60',
    description: 'Limpeza detalhada dos componentes visíveis com produtos e pincéis específicos.',
    note: 'Modalidade com verniz: valor sob consulta.',
  },
  {
    id: '06',
    name: 'Faróis',
    category: 'Polimento + proteção',
    price: 'A partir de R$ 80 o par',
    description: 'Descontaminação, lixamento técnico, polimento e proteção conforme avaliação das lentes.',
    note: 'Produto e compatibilidade do selante precisam ser confirmados.',
  },
  {
    id: '07',
    name: 'Pintura',
    category: 'Descontaminação',
    price: 'A partir de R$ 75',
    description: 'Remoção cuidadosa de contaminantes aderidos ao verniz, com técnicas como clay bar.',
    note: 'O resultado varia conforme o estado da superfície.',
  },
  {
    id: '08',
    name: 'Polimento comercial',
    category: 'Brilho + correção visual',
    price: 'A partir de R$ 350',
    description: 'Tratamento de oxidação e marcas superficiais para melhorar brilho e uniformidade visual.',
    note: 'Não pressupõe eliminação integral de riscos.',
  },
  {
    id: '09',
    name: 'Motos',
    category: 'Lavagem simples',
    price: 'R$ 40',
    description: 'Limpeza de carenagem, tanque e componentes mecânicos visíveis, com acabamento adequado.',
    note: 'Preço informado como fixo no conteúdo de referência.',
  },
  {
    id: '10',
    name: 'Motos detalhadas',
    category: 'Estética premium',
    price: 'A partir de R$ 70',
    description: 'Cantos, carenagens, rodas, chassi, balança, pintura e plásticos tratados em detalhe.',
    note: 'Etapas e produtos dependem da compatibilidade da motocicleta.',
  },
];

const additionalServices = [
  'Chuva ácida',
  'Manchas na pintura',
  'Adesivos e colas',
  'Enceramento',
  'Plásticos externos',
  'Bancos',
  'Teto',
  'Carpete',
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function ComparisonPlaceholder() {
  const [position, setPosition] = useState(52);

  return (
    <div className="comparison-module" style={{ '--compare-position': `${position}%` }}>
      <div className="comparison-viewport">
        <div className="result-plane result-before">
          <span className="result-code">/antes.webp</span>
          <strong>ANTES</strong>
          <small>foto real do veículo</small>
        </div>
        <div className="result-plane result-after">
          <span className="result-code">/depois.webp</span>
          <strong>DEPOIS</strong>
          <small>mesmo ângulo · mesmo veículo</small>
        </div>
        <div className="comparison-line" aria-hidden="true">
          <span>↔</span>
        </div>
        <input
          type="range"
          min="5"
          max="95"
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          aria-label="Demonstração da interação do comparador antes e depois"
        />
      </div>
      <div className="comparison-caption">
        <span>Componente funcional</span>
        <p>Aguardando o par de fotografias reais da LavaMed.</p>
      </div>
    </div>
  );
}

function App() {
  const reducedMotion = useReducedMotion();
  const hasWebGL = useMemo(supportsWebGL, []);
  const [activeService, setActiveService] = useState(services[2]);
  const dialogRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
    return () => document.documentElement.classList.remove('reduced-motion');
  }, [reducedMotion]);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      if (reducedMotion) {
        cinematicState.progress = 0.42;
        gsap.set('[data-reveal], .act-two-overlay', { opacity: 1, y: 0, x: 0, clearProps: 'transform' });
        return;
      }

      const cinematicTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: '#cinematic',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.85,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            cinematicState.progress = self.progress;
          },
        },
      });

      cinematicTimeline
        .to('.hero-copy', { yPercent: -38, opacity: 0, scale: 0.95, duration: 0.34, ease: 'none' }, 0.08)
        .to('.hero-photo', { scale: 1.18, xPercent: -3.8, filter: 'brightness(.56) saturate(.86)', duration: 0.82, ease: 'none' }, 0)
        .to('.cinematic-shutter', { scaleX: 1, duration: 0.2, ease: 'power2.inOut' }, 0.34)
        .to('.cinematic-shutter', { scaleX: 0, transformOrigin: 'right center', duration: 0.2, ease: 'power2.inOut' }, 0.54)
        .fromTo('.act-two-overlay', { opacity: 0, yPercent: 22 }, { opacity: 1, yPercent: 0, duration: 0.34, ease: 'power2.out' }, 0.48)
        .fromTo('.act-two-rule', { scaleX: 0 }, { scaleX: 1, duration: 0.28, ease: 'none' }, 0.58)
        .to('.act-two-overlay', { opacity: 0, yPercent: -16, duration: 0.22, ease: 'none' }, 0.86);

      gsap.from('.hero-kicker, .hero-title > span, .hero-intro, .hero-actions', {
        y: 46,
        opacity: 0,
        duration: 1.15,
        stagger: 0.09,
        ease: 'power4.out',
      });

      gsap.utils.toArray('[data-reveal]').forEach((element) => {
        gsap.fromTo(
          element,
          { y: 72, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 86%', toggleActions: 'play none none reverse' },
          },
        );
      });

      gsap.to('.results-orbit', {
        rotation: 110,
        ease: 'none',
        scrollTrigger: { trigger: '#resultados', start: 'top bottom', end: 'bottom top', scrub: true },
      });

      gsap.to('.closing-image', {
        scale: 1.12,
        yPercent: -5,
        ease: 'none',
        scrollTrigger: { trigger: '#contato', start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
    });

    return () => {
      context.revert();
      cinematicState.progress = 0;
    };
  }, [reducedMotion]);

  const openPendingDialog = () => dialogRef.current?.showModal();

  return (
    <>
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>

      <header className="site-header">
        <a className="identity-pending" href="#top" aria-label="LavaMed — início">
          <span className="identity-symbol" aria-hidden="true" />
          <span>
            <strong>LOGO OFICIAL</strong>
            <small>asset aguardando envio</small>
          </span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#resultados">Resultados</a>
          <a href="#servicos">Serviços</a>
        </nav>
        <button className="header-cta" type="button" onClick={openPendingDialog}>Orçamento <span>↗</span></button>
      </header>

      <main id="conteudo">
        <section className="cinematic" id="cinematic" aria-labelledby="hero-title">
          <div className="cinematic-sticky" id="top">
            <div className="hero-photo" aria-hidden="true">
              <img
                src="/assets/hero/lavamed-conceito-cinematografico.png"
                alt=""
                width="2048"
                height="1152"
                fetchPriority="high"
              />
            </div>
            <div className="hero-vignette" aria-hidden="true" />
            <div className="webgl-layer" aria-hidden="true">
              {hasWebGL ? (
                <Suspense fallback={<div className="webgl-fallback" />}>
                  <WebGLExperience reducedMotion={reducedMotion} />
                </Suspense>
              ) : <div className="webgl-fallback" />}
            </div>
            <div className="film-grain" aria-hidden="true" />
            <div className="cinematic-shutter" aria-hidden="true" />

            <div className="hero-copy">
              <p className="hero-kicker"><span>01</span> Revelação · Itajubá, MG</p>
              <h1 className="hero-title" id="hero-title">
                <span>Do asfalto</span>
                <span>ao <em>espelho.</em></span>
              </h1>
              <div className="hero-bottom">
                <p className="hero-intro">Estética automotiva tratada como matéria, luz e precisão.</p>
                <div className="hero-actions">
                  <a href="#servicos">Explorar serviços <span>↓</span></a>
                  <button type="button" onClick={openPendingDialog}>Solicitar orçamento</button>
                </div>
              </div>
            </div>

            <div className="act-two-overlay">
              <p className="act-label"><span>02</span> Transformação</p>
              <div className="act-two-rule" />
              <h2>A água revela.<br />A técnica <em>refina.</em></h2>
              <p>Da pré-lavagem ao acabamento, cada etapa existe para cuidar da superfície — sem promessas absolutas, com escopo definido para cada veículo.</p>
              <div className="material-index" aria-label="Etapas de tratamento">
                <span>01 · Superfície</span>
                <span>02 · Profundidade</span>
                <span>03 · Reflexo</span>
              </div>
            </div>

            <div className="concept-label">
              <span>VISUAL CONCEITUAL PROVISÓRIO</span>
              <small>Não representa serviço executado pela LavaMed</small>
            </div>
            <div className="scroll-progress" aria-hidden="true"><span /></div>
          </div>
        </section>

        <section className="results-section" id="resultados" aria-labelledby="results-title">
          <div className="results-orbit" aria-hidden="true"><span>RESULTADO REAL · MESMO VEÍCULO · MESMO ÂNGULO ·</span></div>
          <div className="results-heading" data-reveal>
            <p className="act-label dark"><span>03</span> Resultados reais</p>
            <h2 id="results-title">Resultado real<br />não se <em>improvisa.</em></h2>
            <p className="results-intro">A galeria não usa carros de banco de imagens como portfólio. Este espaço está pronto para receber os pares autênticos de antes e depois da LavaMed.</p>
          </div>
          <div className="comparison-wrap" data-reveal>
            <ComparisonPlaceholder />
          </div>
          <aside className="asset-request" data-reveal>
            <span>ARQUIVOS NECESSÁRIOS</span>
            <p><strong>antes.webp</strong> + <strong>depois.webp</strong></p>
            <small>Mesmo veículo, enquadramento equivalente e autorização de uso.</small>
          </aside>
        </section>

        <section className="services-section" id="servicos" aria-labelledby="services-title">
          <div className="services-intro" data-reveal>
            <p className="act-label"><span>04</span> Exploração</p>
            <h2 id="services-title">Escolha onde<br />o cuidado <em>começa.</em></h2>
            <p>Valores reproduzidos conforme o conteúdo oficial. A condição do veículo define o escopo final.</p>
          </div>

          <div className="service-explorer">
            <div className="service-index" role="list" aria-label="Serviços LavaMed">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  role="listitem"
                  className={activeService.id === service.id ? 'is-active' : ''}
                  aria-pressed={activeService.id === service.id}
                  onClick={() => setActiveService(service)}
                >
                  <span>{service.id}</span>
                  <strong>{service.name}</strong>
                  <small>{service.price}</small>
                </button>
              ))}
            </div>

            <article className="service-focus" key={activeService.id} aria-live="polite">
              <div className="service-focus-top">
                <span>{activeService.category}</span>
                <strong>{activeService.id} / 10</strong>
              </div>
              <div className="service-lens" aria-hidden="true"><span /></div>
              <h3>{activeService.name}</h3>
              <p>{activeService.description}</p>
              <div className="service-price">
                <span>Investimento informado</span>
                <strong>{activeService.price}</strong>
              </div>
              <small className="service-note">{activeService.note}</small>
              <button type="button" onClick={openPendingDialog}>Consultar este serviço <span>↗</span></button>
            </article>
          </div>

          <div className="additional-strip" aria-label="Serviços adicionais sob consulta">
            <span className="strip-label">Também sob consulta</span>
            <div>
              {additionalServices.map((service) => <span key={service}>{service}</span>)}
            </div>
          </div>
        </section>

        <section className="closing-section" id="contato" aria-labelledby="closing-title">
          <div className="closing-image" aria-hidden="true">
            <img src="/assets/hero/lavamed-conceito-cinematografico.png" alt="" loading="lazy" />
          </div>
          <div className="closing-overlay" aria-hidden="true" />
          <div className="closing-content" data-reveal>
            <p className="act-label"><span>05</span> Conversão</p>
            <h2 id="closing-title">Seu carro.<br />Outra <em>presença.</em></h2>
            <p>Conte à LavaMed o que o seu veículo precisa. Atendimento no bairro Medicina, em Itajubá.</p>
            <button type="button" className="whatsapp-cta" onClick={openPendingDialog}>
              <span>Iniciar orçamento</span>
              <strong>WhatsApp ↗</strong>
            </button>
            <small className="pending-contact">Número comercial ainda não fornecido — CTA preparado, sem destino fictício.</small>
          </div>
        </section>
      </main>

      <footer>
        <p>LavaMed Estética Automotiva</p>
        <p>Itajubá / MG · Bairro Medicina</p>
        <p>© {new Date().getFullYear()}</p>
      </footer>

      <dialog ref={dialogRef} className="pending-dialog" onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}>
        <button type="button" className="dialog-close" onClick={() => dialogRef.current?.close()} aria-label="Fechar">×</button>
        <span className="dialog-index">CONFIGURAÇÃO PENDENTE</span>
        <h2>Falta o WhatsApp oficial.</h2>
        <p>O botão de orçamento está pronto. Envie o número comercial com DDD para ativarmos o link sem inventar um contato.</p>
        <button type="button" className="dialog-action" onClick={() => dialogRef.current?.close()}>Entendi</button>
      </dialog>
    </>
  );
}

export default App;
