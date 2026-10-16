# LavaMed — Do asfalto ao espelho

Homepage cinematográfica para a LavaMed Estética Automotiva, em Itajubá/MG. A experiência usa React, Three.js, React Three Fiber e GSAP ScrollTrigger.

## Executar

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Assets pendentes

- `public/assets/brand/lavamed-logo.*`: logo oficial em boa resolução, idealmente com fundo transparente.
- `public/assets/before-after/trabalho-001/antes.webp` e `depois.webp`: fotos reais do mesmo veículo e em enquadramentos equivalentes.
- `public/assets/gallery/`: fotografias reais organizadas por serviço.
- WhatsApp comercial com DDD: necessário para ativar o CTA.

O arquivo `public/assets/hero/lavamed-conceito-cinematografico.png` é uma imagem conceitual provisória, gerada para a abertura e identificada como tal na interface. Ela não é apresentada como trabalho realizado pela LavaMed.

## Fallbacks

- Sem WebGL, a fotografia e a iluminação 2D permanecem visíveis.
- Com `prefers-reduced-motion: reduce`, o scrub e os movimentos contínuos são desativados e os dois primeiros atos passam a uma leitura estática.
- O comparador funciona com placeholders técnicos até a entrega do par real de imagens.
