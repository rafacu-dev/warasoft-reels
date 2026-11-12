import React from "react";
import { Composition, Still } from "remotion";
import { Portada } from "./engine/Portada";
import { Demo, TOTAL_DEMO } from "./videos/Demo";

// Cada video se registra con: nuevo-video.py registrar (solo cuando ya tiene voz, real o simulada, y tiempos.json)
export const Root: React.FC = () => (
  <>
    <Composition id="Demo-diorama" component={Demo} durationInFrames={TOTAL_DEMO} fps={30} width={1080} height={1920} />
    <Still id="Portada-Demo" component={Portada} width={1080} height={1920} defaultProps={{ img: "demo/00", series: "DEMO · #1", title: ["¿Una ciudad", "que *nadie*", "construyó?"] }} />
  </>
);
