import { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });
    const particlesRef = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle class
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 3 + 1;
                this.speedX = Math.random() * 1 - 0.5;
                this.speedY = Math.random() * 1 - 0.5;
                this.opacity = Math.random() * 0.5 + 0.2;
                this.hue = Math.random() * 60 + 200; // Blue to purple range
            }

            update() {
                // Move particle
                this.x += this.speedX;
                this.y += this.speedY;

                // Mouse interaction - particles move away from cursor
                const dx = mouseRef.current.x - this.x;
                const dy = mouseRef.current.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 150;

                if (distance < maxDistance) {
                    const force = (maxDistance - distance) / maxDistance;
                    const angle = Math.atan2(dy, dx);
                    this.x -= Math.cos(angle) * force * 3;
                    this.y -= Math.sin(angle) * force * 3;
                }

                // Wrap around edges
                if (this.x < 0) this.x = canvas.width;
                if (this.x > canvas.width) this.x = 0;
                if (this.y < 0) this.y = canvas.height;
                if (this.y > canvas.height) this.y = 0;
            }

            draw() {
                const isDark = document.documentElement.classList.contains('dark');
                const baseColor = isDark ? '150, 200, 255' : '100, 150, 255';

                // Draw glow effect
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
                gradient.addColorStop(0, `rgba(${baseColor}, ${this.opacity * 0.8})`);
                gradient.addColorStop(1, `rgba(${baseColor}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                ctx.fill();

                // Draw core particle
                ctx.fillStyle = `rgba(${baseColor}, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Create particles
        const createParticles = () => {
            const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 10000), 120);
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
            particlesRef.current = particles;
        };
        createParticles();

        // Draw connections between nearby particles
        const drawConnections = () => {
            const isDark = document.documentElement.classList.contains('dark');
            const connectionColor = isDark ? '150, 200, 255' : '100, 150, 255';

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        const opacity = 0.2 * (1 - distance / 120);
                        ctx.strokeStyle = `rgba(${connectionColor}, ${opacity})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        };

        // Animation loop
        const animate = () => {
            // Clear canvas
            const isDark = document.documentElement.classList.contains('dark');
            ctx.fillStyle = isDark ? 'rgba(2, 6, 23, 0.05)' : 'rgba(248, 250, 252, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw connections first
            drawConnections();

            // Update and draw particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        // Mouse move handler
        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        // Touch move handler for mobile
        const handleTouchMove = (e) => {
            if (e.touches.length > 0) {
                mouseRef.current = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);

        // Start animation
        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
};

export default AnimatedBackground;
