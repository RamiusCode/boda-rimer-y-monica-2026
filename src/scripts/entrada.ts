// src/scripts/entrada.ts
// 🎬 Animación de entrada al bajar, igual para todas las secciones.
// Suave y elegante: cada bloque aparece desvaneciéndose y deslizándose
// unos pocos píxeles desde su lado, uno detrás de otro.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type Desde = "izq" | "der" | "arriba" | "abajo" | "centro";

// Cuánto se desplaza cada bloque antes de llegar a su lugar (poco: es una boda)
const DESPLAZAMIENTO: Record<Desde, gsap.TweenVars> = {
  izq: { x: -45 },
  der: { x: 45 },
  arriba: { y: -25 },
  abajo: { y: 25 },
  centro: { scale: 0.96 },
};

// Valor en reposo de cada propiedad que se puede animar
const REPOSO: Record<string, number> = { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1 };

const DURACION = 1.2;
const PAUSA_ENTRE_BLOQUES = 0.15;

interface Extra {
  /** Opacidad final, si el diseño la deja algo transparente */
  opacidad?: number;
  /** Pausa entre elementos cuando el selector agarra varios */
  stagger?: number;
}

/** [selector, lado desde el que entra (o estado inicial propio), extras] */
export type Paso = [selector: string, desde: Desde | gsap.TweenVars, extra?: Extra];

interface OpcionesEntrada {
  /** Elemento que dispara la animación al llegar a la pantalla */
  trigger: string;
  /** Bloques en el orden en que aparecen */
  pasos: Paso[];
  start?: string;
  /** Efectos continuos suaves; arrancan una sola vez, al terminar de aparecer */
  alMostrar?: () => void;
}

export function entrada({ trigger, pasos, start = "top 85%", alMostrar }: OpcionesEntrada) {
  if (!document.querySelector(trigger)) return;

  const inicial = pasos.map(([, desde]) => (typeof desde === "string" ? DESPLAZAMIENTO[desde] : desde));
  const final = inicial.map((vars) => {
    const enReposo: gsap.TweenVars = {};
    for (const prop of Object.keys(vars)) if (prop in REPOSO) enReposo[prop] = REPOSO[prop];
    return enReposo;
  });

  let tl: gsap.core.Timeline | null = null;
  let efectosIniciados = false;
  const iniciarEfectos = () => {
    if (efectosIniciados || !alMostrar) return;
    efectosIniciados = true;
    alMostrar();
  };

  const ocultar = () => {
    tl?.kill();
    pasos.forEach(([selector], i) => gsap.set(selector, { opacity: 0, ...final[i], ...inicial[i] }));
  };

  const mostrar = () => {
    tl?.kill();
    tl = gsap.timeline({ onComplete: iniciarEfectos });
    pasos.forEach(([selector, , extra], i) => {
      tl!.to(
        selector,
        {
          opacity: extra?.opacidad ?? 1,
          ...final[i],
          duration: DURACION,
          ease: "power2.out",
          stagger: extra?.stagger ?? PAUSA_ENTRE_BLOQUES,
        },
        i * PAUSA_ENTRE_BLOQUES
      );
    });
  };

  ocultar();
  ScrollTrigger.create({ trigger, start, onEnter: mostrar, onLeaveBack: ocultar });
}
