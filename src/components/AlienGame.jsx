import { useRef, useEffect, useState } from 'react';
import alienImgSrc from '../assets/alien.png';

function AlienGame({ endGame }) {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const alienRef = useRef({ x: 100, y: 300, radius: 25, velocityY: 0 });
  const spacePressedRef = useRef(false);
  const barriersRef = useRef([]);
  const starsRef = useRef([]);
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);
  const animationRef = useRef(null);
  const imageRef = useRef(new Image());
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    imageRef.current.src = alienImgSrc;
    imageRef.current.onload = () => setImageLoaded(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gravity = 0.05;
    const lift = -2;
    const barrierWidth = 40;
    const barrierGap = 250;
    const barrierSpeed = 4;
    const starSpeed = 3;

    // copy the alien object now so cleanup uses this stable reference
    const alien = alienRef.current;

    // Initialize stars
    starsRef.current = [];
    for (let i = 0; i < 15; i++) {
      starsRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
      });
    }

    // Key handlers
    const handleKeyDown = (e) => {
  if (e.code === 'Space') {
    e.preventDefault(); // ✅ prevent scrolling/page jump
    spacePressedRef.current = true;
  }
};const handleKeyUp = (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    spacePressedRef.current = false;
  }
};
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Draw background
    const drawBackground = () => {
      ctx.fillStyle = '#001d3d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffd60a';
      starsRef.current.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
        ctx.fill();
        star.x -= starSpeed;
        if (star.x < 0) {
          star.x = canvas.width;
          star.y = Math.random() * canvas.height;
        }
      });
    };

    // Draw alien
    const drawAlien = () => {
      if (imageLoaded) {
        ctx.drawImage(
          imageRef.current,
          alienRef.current.x - alienRef.current.radius,
          alienRef.current.y - alienRef.current.radius,
          alienRef.current.radius * 5,
          alienRef.current.radius * 5
        );
      }
    };

    // Draw barriers
    const drawBarriers = () => {
      ctx.fillStyle = '#00b4d8';
      barriersRef.current.forEach((b) => {
        ctx.fillRect(b.x, 0, barrierWidth, b.top);
        ctx.fillRect(b.x, b.top + barrierGap, barrierWidth, canvas.height - (b.top + barrierGap));
        b.x -= barrierSpeed;

        // Collision detection
        if (
          alienRef.current.x + alienRef.current.radius > b.x &&
          alienRef.current.x < b.x + barrierWidth &&
          (alienRef.current.y - alienRef.current.radius < b.top ||
            alienRef.current.y + alienRef.current.radius > b.top + barrierGap)
        ) {
          setGameOver(true);
        }
      });
      barriersRef.current = barriersRef.current.filter((b) => b.x + barrierWidth > 0);
    };

    // Update game
    const update = () => {
      if (spacePressedRef.current) {
        alienRef.current.velocityY = lift;
      } else {
        alienRef.current.velocityY += gravity;
      }
      alienRef.current.y += alienRef.current.velocityY;
      frameCountRef.current++;

      if (frameCountRef.current % 130 === 0) {
        const topHeight = Math.random() * (canvas.height / 2);
        barriersRef.current.push({ x: canvas.width, top: topHeight });
      }

      if (frameCountRef.current % 90 === 0) {
        scoreRef.current++;
      }

      if (
        alienRef.current.y + alienRef.current.radius > canvas.height ||
        alienRef.current.y - alienRef.current.radius < 0
      ) {
        setGameOver(true);
      }
    };

    // Draw score
    const drawScore = () => {
      ctx.fillStyle = '#fff';
      ctx.font = '20px Comic Sans MS';
      ctx.fillText(`Score: ${scoreRef.current}`, 20, 30);
    };

    // Game loop
    const gameLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground();
      drawAlien();
      drawBarriers();
      update();
      drawScore();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationRef.current);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      // Reset refs (use the copied alien variable to avoid reading alienRef.current in cleanup)
      alien.y = canvas.height / 2;
      alien.velocityY = 0;
      barriersRef.current = [];
      starsRef.current = [];
      scoreRef.current = 0;
      frameCountRef.current = 0;
      spacePressedRef.current = false;
    };
  }, [imageLoaded]);

  useEffect(() => {
    if (gameOver) {
      cancelAnimationFrame(animationRef.current);
      endGame(scoreRef.current);
    }
  }, [gameOver, endGame]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        className="bg-linear-to-r from-[#001d3d] to-[#003566] border-4 border-[#00b4d8] rounded-xl shadow-lg"
      />
    </div>
  );
}

export default AlienGame;