"use client";

import { useEffect, useRef } from "react";
import {
  createAsteroidsGame,
  type AsteroidsCallbacks,
  type AsteroidsGame,
} from "@/lib/games/asteroids/engine";

type Props = AsteroidsCallbacks & {
  paused: boolean;
  over: boolean;
};

// Reinicio: el reproductor cambia la `key` y el componente se remonta con un motor nuevo.
export function AsteroidsCanvas({ paused, over, ...callbacks }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<AsteroidsGame | null>(null);
  // Callbacks en ref para no recrear el motor cuando cambia su identidad.
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createAsteroidsGame(canvas, {
      onScore: (s) => callbacksRef.current.onScore(s),
      onLives: (l) => callbacksRef.current.onLives(l),
      onLevel: (l) => callbacksRef.current.onLevel(l),
      onGameOver: (s) => callbacksRef.current.onGameOver(s),
    });
    gameRef.current = game;
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    if (paused || over) game.pause();
    else game.resume();
  }, [paused, over]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
