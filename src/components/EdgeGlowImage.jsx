import { useEffect, useRef } from "react";

/**
 * Affiche une image avec un effet d'illumination qui suit la souris :
 * seuls les bords des zones les plus claires s'allument autour du curseur.
 *
 * @param {object} props
 * @param {string} props.src            Chemin de l'image (même origine recommandée).
 * @param {string} [props.alt]          Texte alternatif (accessibilité).
 * @param {number} [props.radius]       Rayon d'influence de la lumière (0-1). Défaut 0.45.
 * @param {number} [props.intensity]    Intensité de la lueur. Défaut 2.4.
 * @param {number} [props.dim]          Assombrissement de l'image de base (0-1). Défaut 0.12.
 * @param {[number,number,number]} [props.glow] Couleur de la lueur (RVB 0-1). Défaut doré.
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
export default function EdgeGlowImage({
    src,
    alt = "",
    radius = 0.45,
    intensity = 2.4,
    dim = 0.12,
    glow = [1.0, 0.72, 0.34],
    className,
    style,
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext("webgl", { antialias: true });
        if (!gl) return;

        const vs = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
        const fs = `precision highp float;
        uniform sampler2D tex;
        uniform vec2 res;       // taille du canvas (px)
        uniform vec2 imgRes;    // taille de l'image (px)
        uniform vec2 mouse;     // 0-1, y vers le haut
        uniform float time;
        uniform float uRadius;
        uniform float uIntensity;
        uniform float uDim;
        uniform vec3 uGlow;

        vec2 coverUV(vec2 uv, float cAsp, float iAsp){
            if(cAsp > iAsp) return vec2(uv.x, (uv.y-0.5)*(iAsp/cAsp)+0.5);
            return vec2((uv.x-0.5)*(cAsp/iAsp)+0.5, uv.y);
        }
        float lum(vec2 t){
            vec3 c = texture2D(tex, t).rgb;
            return dot(c, vec3(0.299, 0.587, 0.114));
        }
        void main(){
            vec2 uv = gl_FragCoord.xy / res;
            float cAsp = res.x / res.y;
            float iAsp = imgRes.x / imgRes.y;
            vec2 t = coverUV(uv, cAsp, iAsp);
            vec2 e = 1.0 / imgRes;

            float tl=lum(t+vec2(-e.x, e.y)), tc=lum(t+vec2(0.0, e.y)), tr=lum(t+vec2(e.x, e.y));
            float ml=lum(t+vec2(-e.x,0.0)), mc=lum(t),                  mr=lum(t+vec2(e.x,0.0));
            float bl=lum(t+vec2(-e.x,-e.y)), bc=lum(t+vec2(0.0,-e.y)), br=lum(t+vec2(e.x,-e.y));

            float gx = -tl -2.0*ml -bl +tr +2.0*mr +br;
            float gy =  tl +2.0*tc +tr -bl -2.0*bc -br;
            float edge = length(vec2(gx, gy));

            float localBright = max(mc, max(max(tl,tr), max(bl,br)));
            float brightMask = smoothstep(0.45, 0.85, localBright);

            vec2 mp = (mouse - 0.5); mp.x *= cAsp;
            vec2 pp = (uv - 0.5);    pp.x *= cAsp;
            float d = length(pp - mp);
            float light = smoothstep(uRadius, 0.0, d);
            light *= 0.9 + 0.1*sin(time*2.0);

            float glowAmt = edge * brightMask * light;

            vec3 base = texture2D(tex, t).rgb * (1.0 - uDim);
            vec3 col = base + glowAmt * uIntensity * uGlow;
            gl_FragColor = vec4(col, 1.0);
        }`;

        const compile = (type, source) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, source);
            gl.compileShader(s);
            return s;
        };
        const program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(program);
        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, "a");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        const u = (n) => gl.getUniformLocation(program, n);
        const uRes = u("res"), uImg = u("imgRes"), uMouse = u("mouse"), uTime = u("time");
        const uRad = u("uRadius"), uInt = u("uIntensity"), uDimL = u("uDim"), uGlowL = u("uGlow");

        const texture = gl.createTexture();
        const img = new Image();
        let imgReady = false;
        let mouse = [0.5, 0.55];
        let raf = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const resize = () => {
            const r = canvas.getBoundingClientRect();
            canvas.width = Math.max(2, Math.round(r.width * dpr));
            canvas.height = Math.max(2, Math.round(r.height * dpr));
            gl.viewport(0, 0, canvas.width, canvas.height);
        };

        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            imgReady = true;
        };
        img.crossOrigin = "anonymous";
        img.src = src;

        const onMove = (x, y) => {
            const r = canvas.getBoundingClientRect();
            mouse = [(x - r.left) / r.width, 1.0 - (y - r.top) / r.height];
        };
        const mm = (ev) => onMove(ev.clientX, ev.clientY);
        const tm = (ev) => { const t = ev.touches[0]; if (t) onMove(t.clientX, t.clientY); };
        canvas.addEventListener("mousemove", mm);
        canvas.addEventListener("touchmove", tm, { passive: true });

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        const t0 = performance.now();
        const frame = () => {
            if (imgReady) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(u("tex"), 0);
                gl.uniform2f(uRes, canvas.width, canvas.height);
                gl.uniform2f(uImg, img.naturalWidth || 1, img.naturalHeight || 1);
                gl.uniform2f(uMouse, mouse[0], mouse[1]);
                gl.uniform1f(uTime, (performance.now() - t0) / 1000);
                gl.uniform1f(uRad, radius);
                gl.uniform1f(uInt, intensity);
                gl.uniform1f(uDimL, dim);
                gl.uniform3f(uGlowL, glow[0], glow[1], glow[2]);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }
            raf = requestAnimationFrame(frame);
        };
        frame();

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            canvas.removeEventListener("mousemove", mm);
            canvas.removeEventListener("touchmove", tm);
            gl.deleteTexture(texture);
            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
        };
    }, [src, radius, intensity, dim, glow]);

    return (
        <canvas
            ref={canvasRef}
            role="img"
            aria-label={alt}
            className={className}
            style={{ display: "block", width: "100%", height: "100%", ...style }}
        />
    );
}
