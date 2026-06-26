import { useEffect, useRef } from "react";

const TRAIL = 28;
// Résolution du champ de luminance lu côté CPU (l'image est ré-échantillonnée à
// cette taille pour rester bon marché à interroger chaque frame). Le rapport
// d'aspect réel est respecté lors du tracé.
const FIELD = 96;

/**
 * Image WebGL qui INTERAGIT avec son propre contenu lumineux.
 *
 * La comète suit la souris mais est aussi ATTIRÉE par les zones claires de
 * l'image : c'est la luminance qui gouverne son déplacement (montée de gradient
 * vers le plus lumineux) et sa TAILLE (plus grosse sur les zones claires). En
 * complément, les CONTOURS DE BRILLANCE de l'image émettent un liseré lumineux,
 * masqué dans les zones déjà claires (> `edgeThreshold`) : on ne voit donc que le
 * rebord côté sombre, façon « rim light ».
 *
 * @param {object} props
 * @param {string} props.src               Chemin de l'image (même origine recommandée).
 * @param {string} [props.alt]
 * @param {number} [props.stiffness]       Réactivité de la comète vers la souris. Défaut 0.18.
 * @param {number} [props.damping]         Amortissement (0-1). Plus haut = traînée plus longue. Défaut 0.78.
 * @param {number} [props.attract]         Force d'attraction vers les zones claires. Défaut 1.0.
 * @param {number} [props.sparkle]         Quantité d'étincelles. Défaut 1.0.
 * @param {number} [props.dim]             Assombrissement de l'image de base (0-1). Défaut 0.06.
 * @param {number} [props.edge]            Intensité du liseré de contour. Défaut 1.0.
 * @param {number} [props.edgeThreshold]   Luminance au-delà de laquelle le liseré est masqué. Défaut 0.30.
 * @param {[number,number,number]} [props.halo] Couleur du halo (RVB 0-1). Défaut bleuté.
 * @param {[number,number]} [props.bright] Seuils [bas, haut] des zones claires. Défaut [0.45, 0.9].
 * @param {"element"|"window"} [props.pointerSource] Source du suivi souris. "window" pour
 *        un usage en fond de page (le canvas laisse alors passer les clics). Défaut "element".
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
export default function LiquidShineImage({
    src,
    alt = "",
    stiffness = 0.18,
    damping = 0.78,
    attract = 1.0,
    sparkle = 1.0,
    dim = 0.06,
    edge = 1.0,
    edgeThreshold = 0.30,
    halo = [0.55, 0.72, 1.0],
    bright = [0.45, 0.9],
    pointerSource = "element",
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
        #define N ${TRAIL}
        uniform sampler2D tex;
        uniform vec2 res;
        uniform vec2 imgRes;
        uniform float time;
        uniform vec2 trail[N];
        uniform float uSparkle;
        uniform float uDim;
        uniform vec3 uHalo;
        uniform vec2 uBright;
        uniform float uHeadBright;   // luminance sous la tête de comète (0-1) → pilote sa taille
        uniform float uEdge;         // intensité du liseré de contour
        uniform float uEdgeThresh;   // luminance au-delà de laquelle le liseré disparaît
        uniform vec3 uVeilCol;       // couleur du voile (= --surface)
        uniform float uVeilMin;      // opacité du voile en haut, au repos
        uniform float uVeilMax;      // opacité max (bas d'écran / page défilée)
        uniform float uScroll;       // facteur de défilement 0→1

        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        vec2 coverUV(vec2 uv, float cAsp, float iAsp){
            if(cAsp > iAsp) return vec2(uv.x, (uv.y-0.5)*(iAsp/cAsp)+0.5);
            return vec2((uv.x-0.5)*(cAsp/iAsp)+0.5, uv.y);
        }
        float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
        float lumAt(vec2 t){ return lum(texture2D(tex, t).rgb); }
        float segDist(vec2 p, vec2 a, vec2 b){
            vec2 pa = p-a, ba = b-a;
            float h = clamp(dot(pa,ba)/max(dot(ba,ba),1e-5), 0.0, 1.0);
            return length(pa - ba*h);
        }
        void main(){
            vec2 uv = gl_FragCoord.xy / res;
            float cAsp = res.x / res.y;
            float iAsp = imgRes.x / imgRes.y;

            vec2 t = coverUV(uv, cAsp, iAsp);
            vec3 base = texture2D(tex, t).rgb * (1.0 - uDim);
            float L = lum(base);
            float b = smoothstep(uBright.x, uBright.y, L);

            // --- Contours de brillance (Sobel sur la luminance). ---
            // Pas d'échantillonnage = ~1,5 texel, dérivé de la résolution image.
            vec2 e = 1.5 / imgRes;
            float gx = lumAt(t + vec2(e.x, 0.0)) - lumAt(t - vec2(e.x, 0.0));
            float gy = lumAt(t + vec2(0.0, e.y)) - lumAt(t - vec2(0.0, e.y));
            float edgeMag = length(vec2(gx, gy));
            // Le liseré n'apparaît QUE là où la base est sombre (< uEdgeThresh) :
            // on ne révèle que le rebord côté ombre des transitions lumineuses.
            float edgeMask = 1.0 - smoothstep(uEdgeThresh - 0.05, uEdgeThresh + 0.05, L);
            // Scintillement lent pour faire « respirer » les contours.
            float shimmer = 0.75 + 0.25 * sin(time * 2.0 + L * 28.0);
            float edgeGlow = smoothstep(0.04, 0.45, edgeMag) * edgeMask * shimmer;

            vec2 p = uv; p.x *= cAsp;
            float comet = 0.0, halo = 0.0;
            // Réponse NON-LINÉAIRE (courbe en puissance) : on écrase les zones
            // sombres (comète quasi invisible) et on exalte les zones claires.
            float hb = pow(clamp(uHeadBright, 0.0, 1.0), 1.3);
            // Taille : discrète dans les tons sombres, franchement épanouie en pleine
            // lumière. Plancher non nul pour rester perceptible en fond de page.
            float sizeBoost = 0.35 + 2.6 * hb;
            // Luminosité : toujours visible (plancher), éclat très fort sur le clair.
            float glow = 0.55 + 2.2 * hb;
            for(int i = 0; i < N-1; i++){
                vec2 a = trail[i];   a.x *= cAsp;
                vec2 c = trail[i+1]; c.x *= cAsp;
                float fTail = 1.0 - float(i)/float(N-1);
                float w = mix(0.003, 0.022, fTail) * sizeBoost;
                float dd = segDist(p, a, c);
                comet += pow(fTail, 1.6) * smoothstep(w, 0.0, dd);
                halo  += pow(fTail, 1.3) * smoothstep(w*4.0, 0.0, dd) * 0.20;
            }
            vec2 head = trail[0]; head.x *= cAsp;
            float dh = length(p - head);
            float core = exp(-dh*dh*(1400.0 / sizeBoost));

            float tw = hash(floor(p*70.0) + floor(vec2(time*6.0)));
            float spk = smoothstep(0.93, 1.0, tw) * clamp(comet*2.0, 0.0, 1.0)
                        * (0.5 + 0.5*sin(time*22.0 + tw*30.0)) * uSparkle;

            // Le passage de la comète ravive les contours proches d'elle.
            float cometNear = clamp(comet + core, 0.0, 1.0);
            float edgeFinal = edgeGlow * uEdge * (0.35 + 1.4 * cometNear);

            // --- Voile intégré : on assombrit la PHOTO d'abord (lisibilité du texte),
            //     AVANT d'ajouter toute la lumière de la comète. Reproduit le dégradé
            //     vertical d'origine : opacité veilTop en haut (uv.y=1), veilMax en bas.
            float veilTop = mix(uVeilMin, uVeilMax, uScroll);
            float veilAlpha = mix(uVeilMax, veilTop, uv.y);
            vec3 col = mix(base, uVeilCol, veilAlpha);

            // --- Lumière ajoutée APRÈS le voile : comète, cœur, halo, étincelles et
            //     liserés percent donc le dégradé au lieu d'être étouffés par lui. ---
            col += halo * uHalo * glow;
            col += comet * vec3(0.9, 0.95, 1.0) * (0.6 + 0.9*b) * glow;
            col += core * vec3(1.0) * glow;
            col += spk * vec3(1.0) * glow;
            col += edgeFinal * uHalo;        // liseré teinté comme le halo
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

        const quad = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(program, "a");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        const u = (n) => gl.getUniformLocation(program, n);
        const uRes = u("res"), uImg = u("imgRes"), uTime = u("time"), uTrail = u("trail"),
              uSpk = u("uSparkle"), uDimL = u("uDim"), uHaloL = u("uHalo"), uBrightL = u("uBright"),
              uHeadBrightL = u("uHeadBright"), uEdgeL = u("uEdge"), uEdgeThreshL = u("uEdgeThresh");

        const texture = gl.createTexture();
        const img = new Image();
        let imgReady = false;

        // --- Champ de luminance lu côté CPU pour piloter la comète. ---
        // L'image est redessinée dans un petit canvas 2D ; on en extrait une grille
        // FIELD×fieldH de luminances normalisées (0-1), interrogée chaque frame.
        let lumField = null, fieldW = 0, fieldH = 0;

        /**
         * Échantillonne la luminance du champ par interpolation bilinéaire.
         * @param {number} fu Coordonnée horizontale normalisée (0 = gauche, 1 = droite).
         * @param {number} fv Coordonnée verticale normalisée (0 = bas, 1 = haut).
         * @returns {number} Luminance interpolée dans [0,1] (0.5 si champ absent).
         */
        const sampleLum = (fu, fv) => {
            if (!lumField) return 0.5;
            // fv part du bas ; la grille est stockée du haut vers le bas → on inverse.
            const x = Math.min(Math.max(fu, 0), 1) * (fieldW - 1);
            const y = Math.min(Math.max(1 - fv, 0), 1) * (fieldH - 1);
            const x0 = Math.floor(x), y0 = Math.floor(y);
            const x1 = Math.min(x0 + 1, fieldW - 1), y1 = Math.min(y0 + 1, fieldH - 1);
            const tx = x - x0, ty = y - y0;
            const a = lumField[y0 * fieldW + x0], bb = lumField[y0 * fieldW + x1];
            const c = lumField[y1 * fieldW + x0], d = lumField[y1 * fieldW + x1];
            return (a * (1 - tx) + bb * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
        };

        let target = [0.5, 0.55], pos = [0.5, 0.55], vel = [0, 0];
        let headBright = 0.5; // luminance lissée sous la tête (pilote la taille)
        const trail = new Float32Array(TRAIL * 2);
        for (let i = 0; i < TRAIL; i++) { trail[i*2] = 0.5; trail[i*2+1] = 0.55; }
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

            // Construction du champ de luminance (canvas 2D hors-écran, downscalé).
            const iAsp = (img.naturalWidth || 1) / (img.naturalHeight || 1);
            fieldW = iAsp >= 1 ? FIELD : Math.max(2, Math.round(FIELD * iAsp));
            fieldH = iAsp >= 1 ? Math.max(2, Math.round(FIELD / iAsp)) : FIELD;
            const off = document.createElement("canvas");
            off.width = fieldW; off.height = fieldH;
            const ctx = off.getContext("2d", { willReadFrequently: true });
            try {
                ctx.drawImage(img, 0, 0, fieldW, fieldH);
                const data = ctx.getImageData(0, 0, fieldW, fieldH).data;
                lumField = new Float32Array(fieldW * fieldH);
                for (let i = 0; i < fieldW * fieldH; i++) {
                    const r = data[i*4], g = data[i*4+1], bl = data[i*4+2];
                    lumField[i] = (0.299 * r + 0.587 * g + 0.114 * bl) / 255;
                }
            } catch (err) {
                // Image cross-origin sans CORS → canvas « tainted » : on garde le
                // mode souris seul plutôt que de planter (lumField reste null).
                lumField = null;
            }
        };
        img.crossOrigin = "anonymous";
        img.src = src;

        const onMove = (x, y) => {
            const r = canvas.getBoundingClientRect();
            target = [(x - r.left) / r.width, 1.0 - (y - r.top) / r.height];
        };
        const mm = (ev) => onMove(ev.clientX, ev.clientY);
        const tm = (ev) => { const tt = ev.touches[0]; if (tt) onMove(tt.clientX, tt.clientY); };
        // En fond de page, on suit la souris au niveau fenêtre et le canvas laisse
        // passer les clics ; sinon on écoute directement sur le canvas.
        const moveTarget = pointerSource === "window" ? window : canvas;
        if (pointerSource === "window") canvas.style.pointerEvents = "none";
        moveTarget.addEventListener("mousemove", mm);
        moveTarget.addEventListener("touchmove", tm, { passive: true });

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        const t0 = performance.now();
        const frame = () => {
            // 1. Force vers la souris (ressort amorti classique).
            vel[0] += (target[0] - pos[0]) * stiffness;
            vel[1] += (target[1] - pos[1]) * stiffness;

            // 2. Force d'attraction vers le plus lumineux : montée de gradient sur
            //    le champ de luminance, échantillonné autour de la position courante.
            //    C'est l'image qui gouverne ici le mouvement de la comète.
            if (lumField) {
                const e = 0.04;
                const gx = sampleLum(pos[0] + e, pos[1]) - sampleLum(pos[0] - e, pos[1]);
                const gy = sampleLum(pos[0], pos[1] + e) - sampleLum(pos[0], pos[1] - e);
                // Pondérée par la clarté locale : plus c'est déjà clair, plus ça aspire.
                const localL = sampleLum(pos[0], pos[1]);
                const pull = attract * 0.06 * (0.3 + localL);
                vel[0] += gx * pull;
                vel[1] += gy * pull;
            }

            vel[0] *= damping; vel[1] *= damping;
            pos[0] += vel[0]; pos[1] += vel[1];

            for (let i = TRAIL - 1; i > 0; i--) { trail[i*2] = trail[(i-1)*2]; trail[i*2+1] = trail[(i-1)*2+1]; }
            trail[0] = pos[0]; trail[1] = pos[1];

            // 3. Taille de la comète pilotée par la luminance sous la tête (lissée).
            headBright += (sampleLum(pos[0], pos[1]) - headBright) * 0.15;

            if (imgReady) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.uniform1i(u("tex"), 0);
                gl.uniform2f(uRes, canvas.width, canvas.height);
                gl.uniform2f(uImg, img.naturalWidth || 1, img.naturalHeight || 1);
                gl.uniform1f(uTime, (performance.now() - t0) / 1000);
                gl.uniform2fv(uTrail, trail);
                gl.uniform1f(uSpk, sparkle);
                gl.uniform1f(uDimL, dim);
                gl.uniform3f(uHaloL, halo[0], halo[1], halo[2]);
                gl.uniform2f(uBrightL, bright[0], bright[1]);
                gl.uniform1f(uHeadBrightL, headBright);
                gl.uniform1f(uEdgeL, edge);
                gl.uniform1f(uEdgeThreshL, edgeThreshold);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
            }
            raf = requestAnimationFrame(frame);
        };
        frame();

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            moveTarget.removeEventListener("mousemove", mm);
            moveTarget.removeEventListener("touchmove", tm);
            gl.deleteTexture(texture);
            gl.deleteBuffer(quad);
            gl.deleteProgram(program);
        };
    }, [src, stiffness, damping, attract, sparkle, dim, edge, edgeThreshold, halo, bright, pointerSource]);

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
